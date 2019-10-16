import PropTypes from 'prop-types';
import React from 'react';

const Preview = ({ value }) => {
  return <div>{ value }</div>;
}

Preview.propTypes = {
  value: PropTypes.node,
};

export default Preview;
