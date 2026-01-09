package com.example.demo

import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

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

    fun getKlines(symbol: String, interval: String = "1h", limit: Int = 100): List<Double> {
        val url = "$fapiBaseUrl/fapi/v1/klines?symbol=$symbol&interval=$interval&limit=$limit"
        val response = restTemplate.getForObject(url, Array<Any>::class.java)
        
        return response?.mapNotNull { item ->
            (item as? List<*>)?.get(4)?.toString()?.toDouble() ?: (item as? Array<*>)?.get(4)?.toString()?.toDouble()
        } ?: emptyList()
    }
}