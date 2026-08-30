import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { useStaffCoursework } from '@/queries/useStaff';
import type { BadgeTone } from '@/components/ui/Badge';

const TONE: Record<string, BadgeTone> = {
  open: 'warning',
  submitted: 'success',
  graded: 'primary',
};

export function StudentCourseworkScreen() {
  const { data: items } = useStaffCoursework();

  return (
    <StackScreen title="Coursework">
      {(items ?? []).map((item) => (
        <EntityRow
          key={item.id}
          icon="document-text-outline"
          title={item.title}
          subtitle={item.courseTitle}
          meta={`Due ${item.dueDate}`}
          badge={{ label: item.status, tone: TONE[item.status] }}
        />
      ))}
    </StackScreen>
  );
}
