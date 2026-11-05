import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  InfoIcon,
} from './icons';

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-prose text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = '',
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return <div className={`${muted ? 'card-muted' : 'card'} ${className}`}>{children}</div>;
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
        {children}
      </h2>
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-soft': 'btn-danger-soft',
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={`btn ${BUTTON_VARIANT[variant]} ${className}`}
      {...rest}
    />
  );
}

export function IconButton({
  label,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`btn btn-icon ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2_000);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        if (ok) setCopied(true);
      }}
    >
      {copied ? <CheckIcon width={18} height={18} /> : <CopyIcon width={18} height={18} />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.inset = '0';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

const BADGE_TONE: Record<BadgeTone, string> = {
  ok: 'badge-ok',
  warn: 'badge-warn',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge ${BADGE_TONE[tone]} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: 'draft' | 'approved' | 'pending' }) {
  const { t } = useTranslation();
  if (status === 'approved') return <Badge tone="ok">{t('common.approved')}</Badge>;
  if (status === 'draft') return <Badge tone="warn">{t('common.draft')}</Badge>;
  return <Badge tone="neutral">{t('common.pending')}</Badge>;
}

export function DemoBadge() {
  const { t } = useTranslation();
  return <Badge tone="info">{t('common.demo')}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}{' '}
        {optional ? (
          <span className="font-normal text-[var(--muted)]">({t('common.optional')})</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field-input ${className}`} {...rest} />;
}

export function TextArea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field-input ${className}`} {...rest} />;
}

export function Select({
  className = '',
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field-input ${className}`} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function InlineAlert({
  tone = 'info',
  title,
  children,
  icon,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'ok';
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const toneClass = {
    info: 'bg-[var(--info-soft)] text-[var(--info)]',
    warn: 'bg-[var(--warn-soft)] text-[var(--warn)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
    ok: 'bg-[var(--ok-soft)] text-[var(--ok)]',
  }[tone];

  return (
    <div className={`rounded-2xl p-4 ${toneClass}`} role="note">
      <div className="flex gap-3">
        <span className="mt-0.5 shrink-0">{icon ?? <InfoIcon width={20} height={20} />}</span>
        <div className="min-w-0 text-sm leading-6">
          {title ? <p className="font-bold">{title}</p> : null}
          <div className={title ? 'mt-0.5 opacity-90' : 'opacity-90'}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="max-w-md text-sm leading-6 text-[var(--muted)]">{body}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="seg-btn inline-flex items-center gap-1.5"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}) {
  const { t } = useTranslation();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card max-h-[92dvh] w-full animate-pop overflow-y-auto rounded-b-none rounded-t-2xl p-5 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-extrabold leading-7">
            {title}
          </h2>
          {dismissible ? (
            <IconButton label={t('common.close')} onClick={onClose} className="-me-2 -mt-1">
              <CloseIcon width={20} height={20} />
            </IconButton>
          ) : null}
        </div>
        {children}
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
