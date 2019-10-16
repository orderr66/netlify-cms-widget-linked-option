import RelationControl from './Control';
import Preview from './Preview';

const Widget = (opts = {}) => ({
  name: 'relation',
  RelationControl,
  Preview,
  ...opts,
});

export const NetlifyCmsWidgetRelation = { Widget, RelationControl, Preview };
export default NetlifyCmsWidgetRelation;
