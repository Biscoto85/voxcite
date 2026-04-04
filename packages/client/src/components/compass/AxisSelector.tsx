import type { AxisId } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';
import type { CompassView } from './CompassContainer';

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

interface AxisSelectorProps {
  view: CompassView;
  xAxis: AxisId;
  yAxis: AxisId;
  zAxis: AxisId;
  onXChange: (axis: AxisId) => void;
  onYChange: (axis: AxisId) => void;
  onZChange: (axis: AxisId) => void;
}

function AxisDropdown({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string;
  value: AxisId;
  onChange: (axis: AxisId) => void;
  exclude: AxisId[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-400">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AxisId)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs"
      >
        {ALL_AXES.filter((a) => a === value || !exclude.includes(a)).map((a) => (
          <option key={a} value={a}>
            {AXES[a].negative} ↔ {AXES[a].positive}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AxisSelector({ view, xAxis, yAxis, zAxis, onXChange, onYChange, onZChange }: AxisSelectorProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <AxisDropdown label="X" value={xAxis} onChange={onXChange} exclude={[yAxis, ...(view === '3d' ? [zAxis] : [])]} />
      <AxisDropdown label="Y" value={yAxis} onChange={onYChange} exclude={[xAxis, ...(view === '3d' ? [zAxis] : [])]} />
      {view === '3d' && (
        <AxisDropdown label="Z" value={zAxis} onChange={onZChange} exclude={[xAxis, yAxis]} />
      )}
    </div>
  );
}
