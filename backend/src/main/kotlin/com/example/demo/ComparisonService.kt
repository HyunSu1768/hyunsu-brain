package com.example.demo

import org.springframework.stereotype.Service
import kotlin.math.pow

data class MatchResult(
    val score: Double,
    val matchedSubsequence: List<Kline>
)

@Service
class ComparisonService {

    fun normalize(data: List<Double>): List<Double> {
        if (data.isEmpty()) return emptyList()
        val min = data.minOrNull() ?: 0.0
        val max = data.maxOrNull() ?: 1.0
        if (max == min) return data.map { 0.5 }
        return data.map { (it - min) / (max - min) }
    }

    fun calculateMSE(a: List<Double>, b: List<Double>): Double {
        if (a.size != b.size || a.isEmpty()) return Double.MAX_VALUE
        return a.zip(b).map { (x, y) -> (x - y).pow(2) }.average()
    }

    fun resample(data: List<Double>, targetSize: Int): List<Double> {
        if (data.isEmpty()) return emptyList()
        if (data.size == targetSize) return data
        
        val resampled = mutableListOf<Double>()
        for (i in 0 until targetSize) {
            val position = i.toDouble() * (data.size - 1) / (targetSize - 1)
            val index = position.toInt()
            val fraction = position - index
            
            if (index >= data.size - 1) {
                resampled.add(data.last())
            } else {
                val value = data[index] * (1 - fraction) + data[index + 1] * fraction
                resampled.add(value)
            }
        }
        return resampled
    }

    fun findBestMatch(userPattern: List<Double>, priceHistory: List<Kline>): MatchResult? {
        val userLength = userPattern.size
        val historyLength = priceHistory.size

        if (userLength < 2 || historyLength < userLength) {
            return null
        }

        val normalizedUserPattern = normalize(userPattern)
        val priceHistoryCloses = priceHistory.map { it.close }

        var minMse = Double.MAX_VALUE
        var bestMatchSubsequence: List<Kline>? = null

        // Iterate backwards to find the most recent best match
        for (i in historyLength - userLength downTo 0) {
            val subsequenceCloses = priceHistoryCloses.subList(i, i + userLength)
            val normalizedSubsequence = normalize(subsequenceCloses)
            val mse = calculateMSE(normalizedUserPattern, normalizedSubsequence)

            if (mse < minMse) {
                minMse = mse
                bestMatchSubsequence = priceHistory.subList(i, i + userLength)
            }
        }

        if (bestMatchSubsequence == null) {
            return null
        }

        val score = 1.0 - minMse
        return MatchResult(score, bestMatchSubsequence)
    }
}
