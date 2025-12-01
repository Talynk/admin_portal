import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Country {
  id: number
  name: string
  code: string
  flag_emoji: string
  is_active: boolean
}

interface CountriesResponse {
  countries: Country[]
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.getCountries()
        
        if (response.success && response.data) {
          const data = response.data as any
          const countriesData = data.data?.countries || data.countries || []
          setCountries(countriesData)
        } else {
          setError(response.error || 'Failed to fetch countries')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  const getCountryById = (countryId: number | null | undefined): Country | null => {
    if (!countryId) return null
    return countries.find(c => c.id === countryId) || null
  }

  return {
    countries,
    loading,
    error,
    getCountryById,
  }
}
