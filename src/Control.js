import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import AsyncSelect from 'react-select/lib/Async';
import { find, isEmpty, last, debounce } from 'lodash';
import { List, Map, fromJS } from 'immutable';
import Select from 'react-select'
import './Styless.css'


function optionToString(option) {
  return option && option.value ? option.value : '';
}

function convertToOption(raw) {
  if (typeof raw === 'string') {
    return { label: raw, value: raw };
  }
  return Map.isMap(raw) ? raw.toJS() : raw;
}

function getSelectedValue({ value, options, isMultiple }) {
  if (isMultiple) {
    const selectedOptions = List.isList(value) ? value.toJS() : value;

    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      return null;
    }

    return selectedOptions
      .map(i => options.find(o => o.value === (i.value || i)))
      .filter(Boolean)
      .map(convertToOption);
  } else {
    return find(options, ['value', value]) || null;
  }
}

export default class RelationControl extends React.Component {
  didInitialSearch = false;

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: ImmutablePropTypes.map,
    fetchID: PropTypes.string,
    query: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  state = {
    optionData: '',
    optArray: [],
    episodeValue: ''
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.value !== nextProps.value ||
      this.props.hasActiveStyle !== nextProps.hasActiveStyle ||
      this.props.queryHits !== nextProps.queryHits
    );
  }

  componentDidUpdate(prevProps) {
    /**
     * Load extra post data into the store after first query.
     */
    if (this.didInitialSearch) return;
    const { value, field, forID, queryHits, onChange } = this.props;

    if (queryHits !== prevProps.queryHits && queryHits.get(forID)) {
      this.didInitialSearch = true;
      const valueField = field.get('valueField');
      const hits = queryHits.get(forID);
      if (value) {
        const listValue = List.isList(value) ? value : List([value]);
        listValue.forEach(val => {
          const hit = hits.find(i => this.parseNestedFields(i.data, valueField) === val);
          if (hit) {
            onChange(value, {
              [field.get('name')]: {
                [field.get('collection')]: { [val]: hit.data },
              },
            });
          }
        });
      }
    }
  }

  handleChange = selectedOption => {
    const { onChange, field } = this.props;
    let value;
    let metadata;
    if (Array.isArray(selectedOption)) {
      value = selectedOption.map(optionToString);
      metadata =
        (!isEmpty(selectedOption) && {
          [field.get('name')]: {
            [field.get('collection')]: {
              [last(value)]: last(selectedOption).data,
            },
          },
        }) ||
        {};
      onChange(fromJS(value), metadata);
    } else {
      value = optionToString(selectedOption);
      metadata = selectedOption && {
        [field.get('name')]: {
          [field.get('collection')]: { [value]: selectedOption.data },
        },
      };
      onChange(value, metadata);
    }
  };

  parseNestedFields = (targetObject, field) => {
    let nestedField = field.split('.');
    let f = targetObject;
    for (let i = 0; i < nestedField.length; i++) {
      f = f[nestedField[i]];
      if (!f) break;
    }
    if (typeof f === 'object' && f !== null) {
      return JSON.stringify(f);
    }
    return f;
  };

  parseHitOptions = hits => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    const displayField = field.get('displayFields') || field.get('valueField');

    return hits.map(hit => {
      let labelReturn;
      if (List.isList(displayField)) {
        labelReturn = displayField
          .toJS()
          .map(key => this.parseNestedFields(hit.data, key))
          .join(' ');
      } else {
        labelReturn = this.parseNestedFields(hit.data, displayField);
      }
      return {
        data: hit.data,
        value: this.parseNestedFields(hit.data, valueField),
        label: labelReturn,
      };
    });
  };

  loadOptions = debounce((term, callback) => {
    const { field, query, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields');
    const optionsLength = field.get('optionsLength') || 20;
    const searchFieldsArray = List.isList(searchFields) ? searchFields.toJS() : [searchFields];

    query(forID, collection, searchFieldsArray, term).then(({ payload }) => {
      if (payload.response.hits){
        this.setState({ optionData: payload.response.hits })
      }
      let options = this.parseHitOptions(payload.response.hits);

      if (!this.allOptions && !term) {
        this.allOptions = options;
      }

      if (!term) {
        options = options.slice(0, optionsLength);
      }

      callback(options);
    });
  }, 500);

  getRelatedItems = () => {
    const { optionData} = this.state
    let optionArray = []
    const { value  } = this.props
    optionArray.push('Select A Episode')
    Object.entries(optionData).map(([index, obj]) => {
      if (obj.data.title === value) {
        if(obj.data.episodes) {
          Object.entries(obj.data.episodes).map(([episodeIdx, episode]) => {
            optionArray.push(episode.youtubeURL.title)
          })
        }
      }
    })
    this.setState({ optArray: optionArray })
  }

  handleSelectChange = (e) => {
    this.setState({
      episodeValue: e.target.value
    })
  }

  render() {
    const {
      value,
      field,
      forID,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
      queryHits,
    } = this.props;
    console.log('ayee', this.props)
    const { optArray, episodeValue } = this.state
    if(value) {
      this.getRelatedItems()
    }
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;

    const hits = queryHits.get(forID, []);
    const options = this.allOptions || this.parseHitOptions(hits);
    const selectedValue = getSelectedValue({
      options,
      value,
      isMultiple,
    });

    return (
      <div id={forID} className={classNameWrapper}>
        <AsyncSelect
          value={selectedValue}
          inputId={forID}
          defaultOptions
          loadOptions={this.loadOptions}
          onChange={this.handleChange}
          className={classNameWrapper}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          isMulti={isMultiple}
          isClearable={isClearable}
          placeholder=""
        />
        {optArray.length > 0 && (
          <div>
            <label
            style={{
              backgroundColor: "#dfdfe3",
              border: "0",
              borderRadius: "3px 3px 0 0",
              color: "#7a8291",
              fontSize: "12px",
              fontWeight: "600",
              margin: "0",
              padding: "3px 6px 2px",
              position: "relative",
              textTransform: "uppercase",
              transition: "all .2s ease"
            }}
            >
            Episode
            </label>
            <div className="DrowdownField">
              <div className="innerField">
                <div className="dropdownField">
                  <select onChange={this.handleSelectChange} >
                    {optArray.map(item => (
                      <option value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="logoField">
                  <span className="spanField"/>
                  <div className="svgField">
                    <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-19bqh2r">
                      <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <input
              type="text"
              style={{ display: 'none' }}
              value={episodeValue}
          />
          </div>
        )}
      </div>
    );
  }
}

