import React from 'react';
import PropTypes from 'prop-types';
import Event from '../../components/sidebar/event';
import Scrollbars from '../../components/util/scrollbar';
import { connect } from 'react-redux';
import AlertUtil from '../../components/util/alert';
import { openCustomContent } from '../../modules/modal/actions';
import {
  requestEvents,
  requestCategories,
  requestSources,
  selectEvent,
  deselectEvent
} from '../../modules/natural-events/actions';
import util from '../../util/util';
import { EventsAlertModalBody } from '../../components/events/alert-body';
import { getEventsWithinExtent } from '../../modules/natural-events/selectors';
import { get as lodashGet } from 'lodash';
import { collapseSidebar } from '../../modules/sidebar/actions';

class Events extends React.Component {
  constructor(props) {
    super(props);
    this.initRequests();
    this.state = {
      showAlert: !localStorage.getItem('dismissedEventVisibilityAlert')
    };
    this.dismissAlert = this.dismissAlert.bind(this);
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
  dismissAlert() {
    localStorage.setItem('dismissedEventVisibilityAlert', true);
    this.setState({ showAlert: false });
  }
  render() {
    const {
      events,
      isLoading,
      selectEvent,
      selected,
      visibleEvents,
      sources,
      height,
      deselectEvent,
      hasRequestError,
      isMobile,
      openAlertModal,
      showAlert
    } = this.props;
    const errorOrLoadingText = isLoading
      ? 'Loading...'
      : hasRequestError
        ? 'There has been an ERROR retrieving events from the EONET events API'
        : '';
    return (
      <React.Fragment>
        {showAlert && this.state.showAlert ? (
          <AlertUtil
            isOpen={true}
            onClick={openAlertModal}
            onDismiss={this.dismissAlert}
            message="Events may not be visible at all times."
          />
        ) : (
          ''
        )}
        <Scrollbars style={{ maxHeight: height + 'px' }}>
          <div id="wv-events">
            <span
              className="events-loading-text"
              style={
                isLoading || hasRequestError
                  ? { display: 'block' }
                  : { display: 'none' }
              }
            >
              {errorOrLoadingText}
            </span>

            <div
              className="wv-eventslist sidebar-panel"
              style={events ? { display: 'block' } : { display: 'none' }}
            >
              <ul id="wv-eventscontent" className="content map-item-list">
                {events && sources
                  ? events.map(event => (
                    <Event
                      showAlert={showAlert}
                      key={event.id}
                      event={event}
                      selectEvent={() =>
                        selectEvent(event.id, event.date, isMobile)
                      }
                      deselectEvent={deselectEvent}
                      isSelected={
                        selected.id === event.id && visibleEvents[event.id]
                      }
                      selectedDate={
                        selected.id === event.id && visibleEvents[event.id]
                          ? selected.date
                          : null
                      }
                      isVisible={visibleEvents[event.id]}
                      sources={sources}
                    />
                  ))
                  : ''}
              </ul>
            </div>
          </div>
        </Scrollbars>
      </React.Fragment>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  selectEvent: (id, date, isMobile) => {
    dispatch(selectEvent(id, date));
    if (isMobile) {
      dispatch(collapseSidebar());
    }
  },
  openAlertModal: () => {
    dispatch(
      openCustomContent('event_visibility_info', {
        headerText: 'Events may not be visible at all times.',
        backdrop: false,
        size: 'lg',
        wrapClassName: 'clickable-behind-modal',
        bodyComponent: EventsAlertModalBody,
        desktopOnly: true
      })
    );
  },
  deselectEvent: (id, date) => {
    dispatch(deselectEvent());
  },
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
    config,
    proj,
    browser,
    sidebar
  } = state;
  const { selected, showAll } = state.events;

  const apiURL = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoading =
    requestedEvents.isLoading ||
    requestedEventSources.isLoading ||
    requestedEventCategories.isLoading;
  const hasRequestError =
    requestedEvents.error ||
    requestedEventSources.error ||
    requestedEventCategories.error;
  let visibleEvents = {};
  const events = lodashGet(requestedEvents, 'response');
  const sources = lodashGet(requestedEventSources, 'response');
  const mapExtent = lodashGet(state, 'map.extent');
  if (events && mapExtent) {
    let extent = showAll ? proj.selected.maxExtent : mapExtent;
    visibleEvents = getEventsWithinExtent(
      events,
      selected,
      extent,
      proj.selected,
      showAll
    );
  }

  const showAlert =
    util.browser.localStorage &&
    selected.id &&
    sidebar.activeTab === 'events' &&
    browser.greaterThan.small &&
    !localStorage.getItem('dismissedEventVisibilityAlert');

  return {
    events,
    showAll,
    isLoading,
    hasRequestError,
    sources,
    selected,
    visibleEvents,
    apiURL,
    config,
    isMobile: browser.lessThan.medium,
    showAlert
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
  tabTypes: PropTypes.object,
  requestedSources: PropTypes.object,
  requestedCategories: PropTypes.object,
  requestedEvents: PropTypes.object,
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  requestCategories: PropTypes.func,
  apiURL: PropTypes.string,
  config: PropTypes.object,
  showAll: PropTypes.bool,
  isLoading: PropTypes.bool,
  selectEvent: PropTypes.func,
  hasRequestError: PropTypes.bool,
  isMobile: PropTypes.bool,
  showAlert: PropTypes.bool,
  openAlertModal: PropTypes.func
};
