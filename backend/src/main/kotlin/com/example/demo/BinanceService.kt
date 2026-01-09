package com.example.demo

import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

data class Kline(
    val openTime: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double
)

@Service
class BinanceService {
    private val restTemplate = RestTemplate()
    private val fapiBaseUrl = "https://fapi.binance.com"

    fun getTopPerpTickers(): List<String> {
        val url = "$fapiBaseUrl/fapi/v1/ticker/24hr"
        val response = restTemplate.getForObject(url, Array<Any>::class.java)
        
        return response?.mapNotNull { item ->
            @Suppress("UNCHECKED_CAST")
            item as? Map<String, Any> 
        }?.filter { 
            (it["symbol"] as? String)?.endsWith("USDT") == true
        }?.sortedByDescending { 
            (it["quoteVolume"] as? String)?.toDouble() ?: 0.0
        }?.take(100)?.map { it["symbol"] as String } ?: emptyList()
    }

    fun getKlines(symbol: String, interval: String = "1h", limit: Int = 100): List<Kline> {
        val url = "$fapiBaseUrl/fapi/v1/klines?symbol=$symbol&interval=$interval&limit=$limit"
        val response = restTemplate.getForObject(url, Array<Any>::class.java)
        
        return response?.mapNotNull { item ->
            val rawKline = item as? List<*> ?: return@mapNotNull null
            try {
                Kline(
                    openTime = rawKline[0].toString().toLong(),
                    open = rawKline[1].toString().toDouble(),
                    high = rawKline[2].toString().toDouble(),
                    low = rawKline[3].toString().toDouble(),
                    close = rawKline[4].toString().toDouble()
                )
            } catch (e: Exception) {
                null // Or log the error
            }
        } ?: emptyList()
    }
}