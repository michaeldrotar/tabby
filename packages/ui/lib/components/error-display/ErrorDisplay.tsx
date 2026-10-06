import { ErrorHeader } from './ErrorHeader'
import { ErrorResetButton } from './ErrorResetButton'
import { ErrorStackTraceList } from './ErrorStackTraceList'

export type ErrorDisplayProps = {
  error?: Error
  resetErrorBoundary?: () => void
  title: string
  description: string
  detailsLabel: string
  unknownErrorLabel: string
  resetLabel: string
}

export const ErrorDisplay = ({
  error,
  resetErrorBoundary,
  title,
  description,
  detailsLabel,
  unknownErrorLabel,
  resetLabel,
}: ErrorDisplayProps) => (
  <div
    className={`
      flex items-center justify-center bg-gray-50 px-4 py-6
      sm:px-6
      lg:px-8
    `}
  >
    <div className="w-full max-w-md space-y-8">
      <ErrorHeader title={title} description={description} />
      <ErrorStackTraceList
        error={error}
        detailsLabel={detailsLabel}
        unknownErrorLabel={unknownErrorLabel}
      />
      <ErrorResetButton
        resetErrorBoundary={resetErrorBoundary}
        label={resetLabel}
      />
    </div>
  </div>
)
