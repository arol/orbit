import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import get from 'lodash/get';
import moment from 'moment';

import { Row, Col, Icon, Popconfirm, Calendar } from 'antd';

import * as workspaceSelectors from '../../store/Workspaces/selectors';
import * as workspaceActions from '../../store/Workspaces/actions';

import * as entrySelectors from '../../store/Entries/selectors';
import * as entryActions from '../../store/Entries/actions';

import SubHeader from '../../components/SubHeader';
import Loader from '../../components/Loader';

import ProgressChart from '../ProgressChart/ProgressChart';
import './WorkspaceView.css';

class WorkspaceView extends Component {
  componentDidMount() {
    this.fetchEntries();
    document.title = `Orbit | ${this.props.workspace.name}`;
  }

  getEntrySnapshots = () => Object.keys(this.props.entriesById).map(key =>
    this.props.entriesById[key].snapshots.map(snap =>
      moment(snap.date).format('MMM Do YY'),
    ),
  );

  getListData = (value) => {
    let allEntriesInclude = true;
    let atLeastOneInclude = false;
    const entrySnapshots = this.getEntrySnapshots();
    entrySnapshots.forEach((entry) => {
      if (!entry.includes(moment(value._d).format('MMM Do YY'))) allEntriesInclude = false;
      if (entry.includes(moment(value._d).format('MMM Do YY'))) atLeastOneInclude = true;
    });
    if (allEntriesInclude && atLeastOneInclude) return { type: 'success' };
    else if (!allEntriesInclude && atLeastOneInclude) return { type: 'warning' };
    return {};
  };

  dateCellRender = (value) => {
    const day = this.getListData(value);
    return (
      <div className={day.type} />
    );
  };

  fetchEntries = () => {
    this.props.getEntries(this.props.match.params.id);
  };

  confirm = () => {
    this.props.deleteWorkspace(this.props.workspace._id);
  };

  renderSubHeader = () => {
    const { name } = this.props.workspace;
    return (
      <Row>
        <Col span={12}>
          <p>{name}</p>
        </Col>
        <Col span={12}>
          <div className="right">
            <Popconfirm
              placement="bottomRight"
              title="Are you sure you want to delete this Workspace?"
              onConfirm={this.confirm}
              okText="Yes"
              cancelText="No"
            >
              <Icon type="delete" style={{ fontSize: 19, color: '#24273A' }} />
            </Popconfirm>
          </div>
        </Col>
      </Row>
    );
  };

  renderCalendar = () => (
    <Col span={8}>
      <div className="gr">
        <div className="panel-workspace panel">
          <Calendar dateCellRender={this.dateCellRender} fullscreen={false} />
        </div>
      </div>
    </Col>
  );

  renderEnablers = () => {
    const { enablers } = this.props.workspace.template;
    return enablers.map(e => <li key={e}>{e}</li>);
  };

  renderEntry = (workspacesById, id) => {
    const entry = get(workspacesById, id);
    const { workspace } = this.props;
    const workspaceId = workspace._id;
    return (
      <Link
        key={id}
        to={{
          pathname: `${workspaceId}/${entry._id}`,
          state: {
            workspaceId,
            entry,
          },
        }}
      >
        <div className="panel-item">
          <span>{entry.name}</span>
        </div>
      </Link>
    );
  };

  renderEntries = () => {
    const { workspace, entriesById, entriesByIdArray } = this.props;
    return (
      <Col span={16}>
        <div className="gr">
          <div className="panel panel-workspace">
            <div className="panel-section">
              <Row>
                <Col span={12}>
                  <h3>{workspace.template.name}(s)</h3>
                </Col>
                <Col span={12}>
                  <Link to={`${workspace._id}/add`}>
                    <button className="button right">
                      {`Add ${workspace.template.name}`}
                    </button>
                  </Link>
                </Col>
              </Row>
            </div>
            <div className="entries-list">
              {entriesByIdArray.length ? (
                entriesByIdArray.map(id => this.renderEntry(entriesById, id))
              ) : (
                <h1 className="no-result">
                  Add a new {workspace.template.name}
                </h1>
              )}
            </div>
          </div>
        </div>
      </Col>
    );
  };

  renderProgressChart = () => {
    const { entriesById } = this.props;
    return (
      <Col span="24">
        <div className="gr">
          <ProgressChart progressEntries={entriesById} />
        </div>
      </Col>
    );
  };

  renderLoading = () => <Loader />;

  render() {
    const { isFetching } = this.props;
    return (
      <div>
        <SubHeader subHeaderComponent={this.renderSubHeader()} />
        <div className="flex">
          <div className="flex-item">
            <div className="container container-md">
              <Row span={24}>
                {isFetching ? (
                  this.renderLoading()
                ) : (
                  <div>
                    {this.renderCalendar()}
                    {this.renderEntries()}
                    {this.renderProgressChart()}
                  </div>
                )}
              </Row>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { id } = ownProps.match.params;
  const workspace = workspaceSelectors.getWorkspace(state, id);
  const [entriesById, entriesByIdArray] = entrySelectors.getEntriesById(state);
  const isFetching = entrySelectors.isFetching(state);

  return {
    isFetching,
    workspace,
    entriesById,
    entriesByIdArray,
  };
};

const mapDispatchToProps = dispatch => ({
  deleteWorkspace: id => dispatch(workspaceActions.deleteWorkspace(id)),
  getEntries: id => dispatch(entryActions.getEntries(id)),
});

WorkspaceView.propTypes = {
  id: PropTypes.string,
  match: PropTypes.object,
  isFetching: PropTypes.bool,
  workspace: PropTypes.object,
  getEntries: PropTypes.func,
  deleteWorkspace: PropTypes.func,
  entriesById: PropTypes.object,
  entriesByIdArray: PropTypes.array,
};

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceView);
