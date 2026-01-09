package com.example.demo

import org.springframework.web.bind.annotation.*
import java.util.stream.Collectors

data class SchematicFilterRequest(
    val points: List<Double>, // Just the Y values of the schematic
    val interval: String = "1h"
)

data class TickerResult(
    val symbol: String,
    val score: Double,
    val prices: List<Kline>
)

data class SchematicFilterResponse(
    val results: List<TickerResult>,
    val userPattern: List<Double>
)

@RestController
@RequestMapping("/api/schematic")
class SchematicController(
    private val binanceService: BinanceService,
    private val comparisonService: ComparisonService
) {

    @PostMapping("/filter")
    fun filterTickers(@RequestBody request: SchematicFilterRequest): SchematicFilterResponse {
        val userPatternLength = 100 // The length we resample the user's drawing to
        val historyLength = 500     // The total price history to search within

        if (request.points.size < 2) return SchematicFilterResponse(emptyList(), emptyList())

        // Calculate how many candles represent 24 hours for the given interval
        val candlesIn24Hours = when (request.interval) {
            "15m" -> 96
            "1h" -> 24
            "4h" -> 6
            "1d" -> 1
            else -> 24
        }

        // Resample the user's drawing to a consistent length
        val userPattern = comparisonService.resample(request.points, userPatternLength)
        val normalizedUserPattern = comparisonService.normalize(userPattern)

        val topTickers = binanceService.getTopPerpTickers()
        
        val results = topTickers.parallelStream().map { symbol ->
            try {
                // Fetch a longer price history for the sliding window search
                val priceHistory = binanceService.getKlines(symbol, request.interval, historyLength)
                if (priceHistory.size < userPatternLength) return@map null

                // Find the best match for the user's pattern in the ticker's history
                // We restrict the match to end within the last 24 hours
                val matchResult = comparisonService.findBestMatch(userPattern, priceHistory, candlesIn24Hours)
                
                if (matchResult != null) {
                    TickerResult(symbol, matchResult.score, matchResult.matchedSubsequence)
                } else {
                    null
                }
            } catch (e: Exception) {
                // Log the exception in a real application
                null
            }
        }.filter { it != null }.collect(Collectors.toList())

        val sortedResults = results.filterNotNull().sortedByDescending { it.score }.take(10)
        return SchematicFilterResponse(sortedResults, normalizedUserPattern)
    }
}
