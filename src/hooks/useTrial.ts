import { useState, useEffect } from 'react'

const TRIAL_ACTIONS_LIMIT = 3
const TRIAL_ACTIONS_KEY = 'dupefinder-trial-actions'
const TRIAL_REGISTERED_KEY = 'dupefinder-trial-registered'

export function useTrial(isLicenced: boolean) {
  const [trialActions, setTrialActions] = useState(0)
  const [trialRegistered, setTrialRegistered] = useState(false)

  useEffect(() => {
    // Load trial state from localStorage
    const actions = parseInt(localStorage.getItem(TRIAL_ACTIONS_KEY) || '0')
    const registered = localStorage.getItem(TRIAL_REGISTERED_KEY) === 'true'
    setTrialActions(actions)
    setTrialRegistered(registered)

    // Register trial machine with Keygen if not already done
    if (!registered && !isLicenced) {
      window.electronAPI.registerTrial().then(result => {
        if (result.status === 'registered' || result.status === 'already_registered') {
          localStorage.setItem(TRIAL_REGISTERED_KEY, 'true')
          setTrialRegistered(true)
        }
      }).catch(console.error)
    }
  }, [isLicenced])

  const canPerformAction = isLicenced || trialActions < TRIAL_ACTIONS_LIMIT

  const performAction = (): boolean => {
    if (isLicenced) return true
    if (trialActions >= TRIAL_ACTIONS_LIMIT) return false
    const newCount = trialActions + 1
    setTrialActions(newCount)
    localStorage.setItem(TRIAL_ACTIONS_KEY, newCount.toString())
    return true
  }

  const actionsRemaining = isLicenced ? Infinity : Math.max(0, TRIAL_ACTIONS_LIMIT - trialActions)

  return { canPerformAction, performAction, actionsRemaining, trialActions }
}