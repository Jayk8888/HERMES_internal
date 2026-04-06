import Button from './Button'
import InlineAlert from './InlineAlert'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <InlineAlert
      tone="critical"
      role="alert"
      title="Something went wrong"
      message={message}
      actions={onRetry ? (
        <Button variant="secondary" size="small" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    />
  )
}
