import { SimpleFeatureToggle } from './simple-feature-toggle'

export const SendGameEndedFeatureToggle: SimpleFeatureToggle = {
    isEnabled: () => {
        return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production'
    },
}
