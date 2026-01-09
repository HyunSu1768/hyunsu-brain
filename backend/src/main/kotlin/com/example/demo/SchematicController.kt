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
    val prices: List<Double>
)

@RestController
@RequestMapping("/api/schematic")
class SchematicController(
    private val binanceService: BinanceService,
    private val comparisonService: ComparisonService
) {

    @PostMapping("/filter")
    fun filterTickers(@RequestBody request: SchematicFilterRequest): List<TickerResult> {
        val targetLength = 100
        if (request.points.size < 2) return emptyList()

        val normalizedUserPoints = comparisonService.normalize(
            comparisonService.resample(request.points, targetLength)
        )

        val topTickers = binanceService.getTopPerpTickers()
        
        val results = topTickers.parallelStream().map { symbol ->
            try {
                val prices = binanceService.getKlines(symbol, request.interval, targetLength)
                if (prices.size < 10) return@map null
                
                // Resample prices to targetLength if needed (Binance might return fewer candles)
                val resampledPrices = comparisonService.resample(prices, targetLength)
                val normalizedPrices = comparisonService.normalize(resampledPrices)
                val mse = comparisonService.calculateMSE(normalizedUserPoints, normalizedPrices)
                
                TickerResult(symbol, 1.0 - mse, prices)
            } catch (e: Exception) {
                null
            }
        }.filter { it != null }.collect(Collectors.toList())

        return results.filterNotNull().sortedByDescending { it.score }.take(10)
    }
}
