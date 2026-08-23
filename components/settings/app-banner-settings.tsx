'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Megaphone } from 'lucide-react'
import { useAppBanner } from '@/hooks/use-app-banner'
import { useCountries } from '@/hooks/use-countries'
import { toast } from '@/hooks/use-toast'
import {
  DEFAULT_BANNER_MESSAGE,
  EMPTY_BANNER_TARGETING,
  type BannerGender,
} from '@/lib/types/social-feed-settings'

function previewLabel(
  message: string | null,
  genders: BannerGender[],
  ageMin: number | null,
  ageMax: number | null,
  countryNames: string[]
): string {
  if (!message?.trim()) return 'Banner is hidden'
  const parts: string[] = []
  if (genders.length) parts.push(genders.join(', '))
  if (ageMin != null || ageMax != null) {
    parts.push(`age ${ageMin ?? 13}–${ageMax ?? 120}`)
  }
  if (countryNames.length) {
    parts.push(
      countryNames.length <= 3
        ? `countries ${countryNames.join(', ')}`
        : `${countryNames.length} countries`
    )
  }
  return parts.length === 0 ? 'Visible to: everyone' : `Visible to: ${parts.join('; ')}`
}

export function AppBannerSettings() {
  const { settings, loading, saving, error, save, refetch } = useAppBanner()
  const { countries, loading: countriesLoading } = useCountries()

  const [message, setMessage] = useState('')
  const [genders, setGenders] = useState<BannerGender[]>([])
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [countryIds, setCountryIds] = useState<number[]>([])

  useEffect(() => {
    setMessage(settings.banner_message ?? '')
    setGenders(settings.targeting.genders)
    setAgeMin(settings.targeting.age_min != null ? String(settings.targeting.age_min) : '')
    setAgeMax(settings.targeting.age_max != null ? String(settings.targeting.age_max) : '')
    setCountryIds(settings.targeting.country_ids)
  }, [settings])

  const countryNames = useMemo(
    () =>
      countryIds
        .map((id) => countries.find((c) => c.id === id)?.name)
        .filter((n): n is string => !!n),
    [countryIds, countries]
  )

  const parsedAgeMin = ageMin.trim() === '' ? null : Number(ageMin)
  const parsedAgeMax = ageMax.trim() === '' ? null : Number(ageMax)

  const toggleGender = (g: BannerGender) => {
    setGenders((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const toggleCountry = (id: number) => {
    setCountryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const validateAges = (): string | null => {
    if (parsedAgeMin != null && (!Number.isInteger(parsedAgeMin) || parsedAgeMin < 13 || parsedAgeMin > 120)) {
      return 'Age min must be an integer between 13 and 120'
    }
    if (parsedAgeMax != null && (!Number.isInteger(parsedAgeMax) || parsedAgeMax < 13 || parsedAgeMax > 120)) {
      return 'Age max must be an integer between 13 and 120'
    }
    if (parsedAgeMin != null && parsedAgeMax != null && parsedAgeMin > parsedAgeMax) {
      return 'Age min cannot be greater than age max'
    }
    return null
  }

  const handleSave = async () => {
    const ageError = validateAges()
    if (ageError) {
      toast({ title: 'Invalid targeting', description: ageError, variant: 'destructive' })
      return
    }
    const result = await save({
      message,
      targeting: {
        genders,
        age_min: parsedAgeMin,
        age_max: parsedAgeMax,
        country_ids: countryIds,
      },
    })
    if (result.success) {
      toast({ title: 'Banner saved', description: result.message || 'App banner updated.' })
    } else {
      toast({ title: 'Save failed', description: result.error, variant: 'destructive' })
    }
  }

  const handleHide = async () => {
    const result = await save({ message: null })
    if (result.success) {
      setMessage('')
      toast({ title: 'Banner hidden', description: 'Clients will not show a banner.' })
    } else {
      toast({ title: 'Hide failed', description: result.error, variant: 'destructive' })
    }
  }

  const handleRestoreDefault = () => {
    setMessage(DEFAULT_BANNER_MESSAGE)
  }

  const handleClearTargeting = async () => {
    setGenders([])
    setAgeMin('')
    setAgeMax('')
    setCountryIds([])
    const result = await save({ targeting: { ...EMPTY_BANNER_TARGETING } })
    if (result.success) {
      toast({ title: 'Targeting cleared', description: 'Banner shows to everyone (if a message is set).' })
    } else {
      toast({ title: 'Clear failed', description: result.error, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading banner settings…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            App banner
          </CardTitle>
          <CardDescription>
            Global message for all clients. Clear the message to hide it. Targeting uses the same
            strict rules as ads: viewers missing a set attribute do not see the banner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="banner-message">Message</Label>
            <Textarea
              id="banner-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={DEFAULT_BANNER_MESSAGE}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Empty / whitespace messages are stored as hidden.
            </p>
          </div>

          <p className="text-sm font-medium">
            {previewLabel(
              message.trim() || null,
              genders,
              parsedAgeMin,
              parsedAgeMax,
              countryNames
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
            <Button variant="outline" onClick={handleRestoreDefault} disabled={saving}>
              Restore default
            </Button>
            <Button variant="destructive" onClick={() => void handleHide()} disabled={saving}>
              Clear / hide banner
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Targeting</CardTitle>
          <CardDescription>
            Optional filters. Empty dimensions mean “all”. Guests and users without gender, DOB, or
            country never match a set filter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Genders</Label>
            <div className="flex gap-6">
              {(['male', 'female'] as BannerGender[]).map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox checked={genders.includes(g)} onCheckedChange={() => toggleGender(g)} />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age-min">Age min</Label>
              <Input
                id="age-min"
                type="number"
                min={13}
                max={120}
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age-max">Age max</Label>
              <Input
                id="age-max"
                type="number"
                min={13}
                max={120}
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                placeholder="No maximum"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Countries</Label>
            {countriesLoading ? (
              <p className="text-sm text-muted-foreground">Loading countries…</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border p-3 grid gap-2 sm:grid-cols-2">
                {countries
                  .filter((c) => c.is_active !== false)
                  .map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={countryIds.includes(c.id)}
                        onCheckedChange={() => toggleCountry(c.id)}
                      />
                      <span className="truncate">
                        {c.flag_emoji ? `${c.flag_emoji} ` : ''}
                        {c.name}
                      </span>
                    </label>
                  ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              Save targeting
            </Button>
            <Button variant="outline" onClick={() => void handleClearTargeting()} disabled={saving}>
              Clear targeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
