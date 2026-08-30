import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { useStaffCoursework } from '@/queries/useStaff';
import { useToastStore } from '@/store/useToastStore';
import type { BadgeTone } from '@/components/ui/Badge';

const TONE: Record<string, BadgeTone> = {
  open: 'warning',
  submitted: 'success',
  graded: 'primary',
};

export function StudentCourseworkScreen() {
  const { data: items } = useStaffCoursework();
  const showToast = useToastStore((state) => state.show);
  const list = items ?? [];

  return (
    <StackScreen title="Coursework">
      {list.length === 0 ? (
        <EmptyState icon="document-text-outline" message="No coursework assigned yet." />
      ) : (
        list.map((item) => (
          <EntityRow
            key={item.id}
            icon="document-text-outline"
            title={item.title}
            subtitle={item.courseTitle}
            meta={`Due ${item.dueDate}`}
            badge={{ label: item.status, tone: TONE[item.status] }}
            onPress={() => showToast('Submission details coming soon', 'neutral')}
          />
        ))
      )}
    </StackScreen>
  );
}
