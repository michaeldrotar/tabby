import { WarningIcon } from '../../icons'

export const ErrorHeader = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className="text-center">
    <WarningIcon className={'mx-auto h-24 w-24 text-red-500'} />
    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
    <p className="mt-2 text-sm text-gray-600">{description}.</p>
  </div>
)
