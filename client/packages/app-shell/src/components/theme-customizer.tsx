import {
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@mb/ui-primitives';
import { styleRegistry } from '@mb/ui-tokens';
import { Check, LayoutTemplate, Palette, PanelLeft, Settings2, SunMoon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayoutPreset } from '../layouts/use-layout-preset';
import { type StyleId, useStyle } from '../theme';

const scaleOptions = [
  { value: 'default', label: '⊘' },
  { value: 'xs', label: 'XS' },
  { value: 'lg', label: 'LG' },
] as const;

const radiusOptions = [
  { value: 'default', label: '⊘' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
] as const;

const contentLayoutOptions = [
  { value: 'default', labelKey: 'theme.contentLayout.default' },
  { value: 'centered', labelKey: 'theme.contentLayout.centered' },
] as const;

const colorModeOptions = [
  { value: 'light', labelKey: 'theme.light' },
  { value: 'dark', labelKey: 'theme.dark' },
] as const;

const sidebarModeOptions = [
  { value: 'default', labelKey: 'theme.sidebarMode.default' },
  { value: 'icon', labelKey: 'theme.sidebarMode.icon' },
] as const;

// 布局预设元数据 — 独立于 registry 避免循环依赖
const layoutPresets = [
  { id: 'inset', nameKey: 'layout.inset', descKey: 'layout.insetDesc' },
  {
    id: 'module-switcher',
    nameKey: 'layout.moduleSwitcher',
    descKey: 'layout.module-switcherDesc',
  },
] as const;

export function ThemeCustomizer() {
  const { t } = useTranslation('shell');
  const { presetId, setPreset } = useLayoutPreset();
  const {
    styleId,
    setStyle,
    colorMode,
    setColorMode,
    scale,
    setScale,
    radius,
    setRadius,
    contentLayout,
    setContentLayout,
    sidebarMode,
    setSidebarMode,
    resetCustomizer,
  } = useStyle();
  const selectedStyle = styleRegistry.get(styleId);
  const contentLayoutSupported = presetId === 'inset';
  const sidebarModeSupported = presetId === 'inset';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('theme.customize')}>
          <Settings2 className="size-4" />
          <span className="hidden xl:inline">{t('theme.customize')}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] rounded-xl border p-0 shadow-xl">
        <div className="space-y-4 p-4">
          <PopoverHeader className="gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <PopoverTitle>{t('theme.customize')}</PopoverTitle>
                <PopoverDescription>{t('theme.description')}</PopoverDescription>
              </div>
              <Button variant="outline" size="xs" onClick={resetCustomizer}>
                {t('theme.reset')}
              </Button>
            </div>
          </PopoverHeader>

          <section className="space-y-2">
            <SectionLabel icon={LayoutTemplate}>{t('theme.layoutLabel')}</SectionLabel>
            <div className="grid gap-2">
              {layoutPresets.map((preset) => {
                const active = preset.id === presetId;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPreset(preset.id)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                      active
                        ? 'border-primary bg-accent text-foreground'
                        : 'border-border bg-background hover:bg-accent/60',
                    )}
                  >
                    <div>
                      <div className="text-sm font-semibold">{t(preset.nameKey)}</div>
                      <p className="text-xs text-muted-foreground">{t(preset.descKey)}</p>
                    </div>
                    {active && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {t('theme.active')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <SelectField
            label={t('theme.styleLabel')}
            value={styleId}
            onValueChange={(value) => setStyle(value as StyleId)}
            options={styleRegistry.getAll().map((style) => ({
              value: style.id,
              label: style.displayName,
            }))}
          />

          <ToggleField
            label={t('theme.modeLabel')}
            value={colorMode}
            onValueChange={(value) => setColorMode(value as 'light' | 'dark')}
            options={colorModeOptions.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
              className: 'flex-1',
            }))}
            icon={SunMoon}
          />

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              label={t('theme.scaleLabel')}
              value={scale}
              onValueChange={(value) => setScale(value as 'default' | 'xs' | 'lg')}
              options={scaleOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />

            <ToggleField
              label={t('theme.radiusLabel')}
              value={radius === 'none' ? '' : radius}
              onValueChange={(value) => setRadius(value as 'default' | 'sm' | 'md' | 'lg' | 'xl')}
              options={radiusOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <ToggleField
            label={t('theme.contentLayoutLabel')}
            value={contentLayout}
            onValueChange={(value) => setContentLayout(value as 'default' | 'centered')}
            options={contentLayoutOptions.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
              className: 'flex-1',
              disabled: !contentLayoutSupported,
            }))}
          />

          {!contentLayoutSupported && (
            <p className="text-xs text-muted-foreground">{t('theme.contentLayoutHint')}</p>
          )}

          <ToggleField
            label={t('theme.sidebarModeLabel')}
            value={sidebarMode}
            onValueChange={(value) => setSidebarMode(value as 'default' | 'icon')}
            options={sidebarModeOptions.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
              className: 'flex-1',
              disabled: !sidebarModeSupported,
            }))}
            icon={PanelLeft}
          />

          {!sidebarModeSupported && (
            <p className="text-xs text-muted-foreground">{t('theme.sidebarModeHint')}</p>
          )}

          <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground/90">
              <Palette className="size-3.5" />
              <span>{t('theme.summary')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              <SummaryPill>
                {t(
                  layoutPresets.find((p) => p.id === presetId)?.nameKey ?? layoutPresets[0].nameKey,
                )}
              </SummaryPill>
              <SummaryPill>{selectedStyle?.displayName}</SummaryPill>
              <SummaryPill>{colorMode === 'dark' ? t('theme.dark') : t('theme.light')}</SummaryPill>
              <SummaryPill>{t(`theme.scale.${scale}`)}</SummaryPill>
              <SummaryPill>{radius === 'none' ? '0' : t(`theme.radius.${radius}`)}</SummaryPill>
              <SummaryPill>{t(`theme.contentLayout.${contentLayout}`)}</SummaryPill>
              <SummaryPill>{t(`theme.sidebarMode.${sidebarMode}`)}</SummaryPill>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: string;
  icon: typeof Palette;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
      <Icon className="size-3.5" />
      <span>{children}</span>
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const labelId = useId();

  return (
    <div className="grid gap-1.5">
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-labelledby={labelId} className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({
  label,
  value,
  onValueChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean; className?: string }>;
  icon?: typeof Palette;
}) {
  const labelId = useId();

  return (
    <div className="grid gap-1.5">
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue);
          }
        }}
        aria-labelledby={labelId}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            size="sm"
            disabled={option.disabled}
            className={cn('min-w-9', option.className)}
          >
            {Icon && option.value === value ? <Icon className="size-3.5" /> : null}
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function SummaryPill({ children }: { children?: string }) {
  if (!children) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-1">
      <Check className="size-3" />
      {children}
    </span>
  );
}
