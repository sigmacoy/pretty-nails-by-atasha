// Mock for recharts to prevent memory leaks in tests
import React from 'react';

const createMockComponent = (displayName: string) => {
  const MockComponent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    React.createElement('div', { 'data-testid': displayName, ...props }, children)
  );
  MockComponent.displayName = displayName;
  return MockComponent;
};

export const LineChart = createMockComponent('LineChart');
export const Line = createMockComponent('Line');
export const AreaChart = createMockComponent('AreaChart');
export const Area = createMockComponent('Area');
export const BarChart = createMockComponent('BarChart');
export const Bar = createMockComponent('Bar');
export const PieChart = createMockComponent('PieChart');
export const Pie = createMockComponent('Pie');
export const ScatterChart = createMockComponent('ScatterChart');
export const Scatter = createMockComponent('Scatter');
export const ComposedChart = createMockComponent('ComposedChart');
export const RadarChart = createMockComponent('RadarChart');
export const Radar = createMockComponent('Radar');
export const FunnelChart = createMockComponent('FunnelChart');
export const Funnel = createMockComponent('Funnel');
export const Treemap = createMockComponent('Treemap');
export const Sankey = createMockComponent('Sankey');
export const RadialBarChart = createMockComponent('RadialBarChart');
export const RadialBar = createMockComponent('RadialBar');

export const XAxis = createMockComponent('XAxis');
export const YAxis = createMockComponent('YAxis');
export const ZAxis = createMockComponent('ZAxis');
export const AngleAxis = createMockComponent('AngleAxis');
export const RadiusAxis = createMockComponent('RadiusAxis');
export const PolarGrid = createMockComponent('PolarGrid');
export const PolarAngleAxis = createMockComponent('PolarAngleAxis');
export const PolarRadiusAxis = createMockComponent('PolarRadiusAxis');

export const CartesianGrid = createMockComponent('CartesianGrid');
export const Legend = createMockComponent('Legend');
export const Tooltip = createMockComponent('Tooltip');
export const Label = createMockComponent('Label');
export const LabelList = createMockComponent('LabelList');
export const ReferenceLine = createMockComponent('ReferenceLine');
export const ReferenceDot = createMockComponent('ReferenceDot');
export const ReferenceArea = createMockComponent('ReferenceArea');
export const ErrorBar = createMockComponent('ErrorBar');
export const Brush = createMockComponent('Brush');
export const Cell = createMockComponent('Cell');

export const ResponsiveContainer = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  React.createElement('div', { 'data-testid': 'ResponsiveContainer', ...props }, children)
);

export default {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ComposedChart,
  RadarChart,
  Radar,
  FunnelChart,
  Funnel,
  Treemap,
  Sankey,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  ZAxis,
  AngleAxis,
  RadiusAxis,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  Label,
  LabelList,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
  ErrorBar,
  Brush,
  Cell,
  ResponsiveContainer,
};