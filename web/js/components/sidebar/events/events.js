import React from 'react';
import PropTypes from 'prop-types';
import Event from './event';
import Scrollbars from '../../util/scrollbar';
import { connect } from 'react-redux';
import {
  requestEvents,
  requestCategories,
  requestSources
} from '../../../modules/natural-events/actions';
import { getEventsWithinExtent } from '../../../modules/natural-events/selectors';
import { get as lodashGet } from 'lodash';

class Events extends React.Component {
  constructor(props) {
    super(props);
    this.initRequests();
  }
  initRequests() {
    const {
      requestSources,
      requestCategories,
      requestEvents,
      apiURL,
      config
    } = this.props;

    let eventsRequestURL = apiURL + '/events';
    let categoryRequestURL = apiURL + '/categories';
    let sourceRequestURL = apiURL + '/sources';

    const mockEvents = lodashGet(config, 'config.parameters.mockEvents');
    const mockCategories = lodashGet(
      config,
      'config.parameters.mockCategories'
    );
    const mockSources = lodashGet(config, 'config.parameters.mockSources');

    if (mockEvents) {
      console.warn('Using mock events data: ' + mockEvents);
      eventsRequestURL = 'mock/events_data.json-' + mockEvents;
    }
    if (mockCategories) {
      console.warn('Using mock categories data: ' + mockCategories);
      categoryRequestURL = 'mock/categories_data.json-' + mockCategories;
    }
    if (mockSources) {
      console.warn('Using mock categories data: ' + mockSources);
      sourceRequestURL = 'mock/categories_data.json-' + mockSources;
    }
    requestEvents(eventsRequestURL);
    requestCategories(categoryRequestURL);
    requestSources(sourceRequestURL);
  }
  render() {
    const {
      events,
      showAll,
      isLoading,
      selectEvent,
      selected,
      visibleEvents,
      sources,
      height,
      deselectEvent
    } = this.props;

    return (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div id="wv-events">
          <span
            className="events-loading-text"
            style={isLoading ? { display: 'block' } : { display: 'none' }}
          >
            Loading...
          </span>
          <div
            className="wv-eventslist sidebar-panel"
            style={events ? { display: 'block' } : { display: 'none' }}
          >
            <ul id="wv-eventscontent" className="content map-item-list">
              {events && sources
                ? events.map(event => (
                  <Event
                    key={event.id}
                    event={event}
                    selectEvent={selectEvent}
                    deselectEvent={deselectEvent}
                    selectedDate={
                      selected.id === event.id &&
                        (showAll || visibleEvents[event.id])
                        ? selected.date
                        : null
                    }
                    isVisible={visibleEvents[event.id] || showAll}
                    sources={sources}
                  />
                ))
                : ''}
            </ul>
          </div>
        </div>
      </Scrollbars>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  requestEvents: url => {
    dispatch(requestEvents(url));
  },
  requestSources: url => {
    dispatch(requestSources(url));
  },
  requestCategories: url => {
    dispatch(requestCategories(url));
  }
});
function mapStateToProps(state) {
  const {
    requestedEvents,
    requestedEventSources,
    requestedEventCategories,
    config
  } = state;
  const { selected, showAll } = state.events;
  const apiURL = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoading =
    requestedEvents.isLoading ||
    requestedEventSources.isLoading ||
    requestedEventCategories.isLoading;

  let visibleEvents = {};
  const events = lodashGet(requestedEvents, 'response');
  const sources = lodashGet(requestedEventSources, 'response');
  console.log(events);
  if (events) {
    visibleEvents = getEventsWithinExtent(
      events,
      selected,
      state.legacy.map.extent,
      state
    );
  }

  return {
    events,
    showAll,
    isLoading,
    sources,
    selected,
    visibleEvents,
    apiURL,
    config
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Events);

Events.propTypes = {
  events: PropTypes.array,
  sources: PropTypes.array,
  selected: PropTypes.object,
  visibleEvents: PropTypes.object,
  height: PropTypes.number,
  deselectEvent: PropTypes.func,
  tabTypes: PropTypes.object
};
