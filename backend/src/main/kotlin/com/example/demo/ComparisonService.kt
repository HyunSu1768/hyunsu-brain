package com.example.demo

import org.springframework.stereotype.Service
import kotlin.math.pow

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
}
