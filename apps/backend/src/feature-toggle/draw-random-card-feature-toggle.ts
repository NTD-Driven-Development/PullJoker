import { SimpleFeatureToggle } from './simple-feature-toggle'

export const DrawRandomCardFeatureToggle: SimpleFeatureToggle = {
    isEnabled: () => {
        return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'ci'
    },
}
