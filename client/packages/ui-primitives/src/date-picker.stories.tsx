import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from './calendar';
import { DatePicker } from './date-picker';

const calendarMeta = {
  title: 'Primitives/Calendar',
  component: Calendar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default calendarMeta;
type CalendarStory = StoryObj<typeof calendarMeta>;

export const CalendarDefault: CalendarStory = {
  args: {
    mode: 'single',
  },
};

// DatePicker 的 stories 作为额外导出
const datePickerMeta = {
  title: 'Primitives/DatePicker',
  component: DatePicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>;

export const DatePickerDefault: StoryObj<typeof datePickerMeta> = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <DatePicker
        value={date}
        onValueChange={setDate}
        placeholder="选择日期..."
        className="w-[240px]"
      />
    );
  },
};

export const DatePickerWithValue: StoryObj<typeof datePickerMeta> = {
  render: () => <DatePicker value={new Date()} placeholder="选择日期..." className="w-[240px]" />,
};

export const DatePickerDisabled: StoryObj<typeof datePickerMeta> = {
  render: () => <DatePicker disabled placeholder="不可选择" className="w-[240px]" />,
};
