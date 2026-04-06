export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      padding: '1rem 1.25rem',
      borderRadius: 8,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#dc2626',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem'
    }}>
      <span style={{ fontSize: 14 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: 13,
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: 6,
            padding: '4px 10px',
            background: 'transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}
