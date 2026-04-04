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
  id,
  value,
  onChange,
  exclude,
}: {
  label: string;
  id: string;
  value: AxisId;
  onChange: (axis: AxisId) => void;
  exclude: AxisId[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-xs text-gray-400">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as AxisId)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-purple-500"
      >
        {ALL_AXES.filter((a) => a === value || !exclude.includes(a)).map((a) => (
          <option key={a} value={a}>
            {AXES[a].negative} ↔ {AXES[a].positive}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AxisSelector({ view, xAxis, yAxis, zAxis, onXChange, onYChange, onZChange }: AxisSelectorProps) {
  return (
    <div className="flex gap-3 flex-wrap" role="group" aria-label="Sélection des axes">
      <AxisDropdown label="X" id="axis-x" value={xAxis} onChange={onXChange} exclude={[yAxis, ...(view === '3d' ? [zAxis] : [])]} />
      <AxisDropdown label="Y" id="axis-y" value={yAxis} onChange={onYChange} exclude={[xAxis, ...(view === '3d' ? [zAxis] : [])]} />
      {view === '3d' && (
        <AxisDropdown label="Z" id="axis-z" value={zAxis} onChange={onZChange} exclude={[xAxis, yAxis]} />
      )}
    </div>
  );
}
