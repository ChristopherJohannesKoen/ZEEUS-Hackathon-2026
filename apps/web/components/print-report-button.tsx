'use client';

import { Button } from '@packages/ui';

export function PrintReportButton() {
  return (
    <Button
      className="bg-[#00654A] hover:bg-[#0b7a59]"
      onClick={() => {
        window.print();
      }}
      type="button"
    >
      Export PDF
    </Button>
  );
}
