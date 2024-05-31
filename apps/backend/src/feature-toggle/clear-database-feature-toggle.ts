import { SimpleFeatureToggle } from './simple-feature-toggle'

export const ClearDatabaseFeatureToggle: SimpleFeatureToggle = {
    isEnabled: () => {
        return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'ci'
    },
}
