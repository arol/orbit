import { push } from 'react-router-redux';

import * as types from './actionTypes';
import * as utils from '../../utils';

import * as alertTypes from '../Alert/actionTypes';

import WorkspaceService from '../../services/workspaces.service';

// instantiate the Workspace service
const workspaceService = WorkspaceService();

/** Workspaces Actions */

export const getWorkspaces = () => async (dispatch) => {
  try {
    dispatch({ type: types.WORKSPACES_FETCHED });

    const data = await workspaceService.fetchWorkspaces();

    const { workspaces } = data;

    if (data.errors) {
      throw new Error(workspaces.errors);
    }

    // normalise workspaces
    const workspacesById = utils.keyById(workspaces, '_id');

    dispatch({ type: types.WORKSPACES_FETCHED_SUCCESS, workspacesById });
  } catch (err) {
    dispatch({
      type: types.WORKSPACES_FETCHED_FAILURE,
      error: err,
    });
  }
};

export const addWorkspace = formData => async (dispatch) => {
  try {
    dispatch({ type: types.WORKSPACES_ADD });

    const { workspaceName, entryReference, enablers } = formData;
    const enablersWithoutNull = enablers.filter(n => n !== undefined);
    const workspaceData = {
      name: workspaceName,
      template: {
        name: entryReference,
        enablers: enablersWithoutNull,
      },
    };

    const workspace = await workspaceService.createWorkspace(workspaceData);

    const { errors, _id } = workspace;

    if (errors) {
      throw new Error(errors);
    }

    // normalise
    const workspaceById = utils.keyById([workspace], '_id');

    dispatch({ type: types.WORKSPACES_ADD_SUCCESS, workspaceById });
    dispatch(push(`/workspace/${_id}`));
    dispatch({
      type: alertTypes.ALERT_SUCCESS,
      messageContent: 'Succesfully created workspace!',
    });
  } catch (err) {
    dispatch({
      type: types.WORKSPACES_ADD_FAILURE,
      error: err,
    });
    dispatch(push('/dashboard'));
    dispatch({
      type: alertTypes.ALERT_ERROR,
      messageContent: 'Sorry, there was a problem creating the workspace. Please try again.',
    });
  }
};

export const deleteWorkspace = id => async (dispatch) => {
  try {
    dispatch({ type: types.WORKSPACES_DELETE });
    dispatch(push('/dashboard'));

    const response = await workspaceService.deleteWorkspace(id);

    if (!response.ok) {
      throw new Error('Failed to delete workspace');
    }

    dispatch({ type: types.WORKSPACES_DELETE_SUCCESS, id });
  } catch (err) {
    dispatch({ type: types.WORKSPACES_ADD_FAILURE, error: err });
  }
};
