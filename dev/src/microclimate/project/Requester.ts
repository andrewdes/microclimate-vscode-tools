/*******************************************************************************
 * Copyright (c) 2018 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

import * as vscode from "vscode";
import * as request from "request-promise-native";

import Project from "./Project";
import StartModes, { getUserFriendlyStartMode } from "../../constants/StartModes";
import Endpoints from "../../constants/Endpoints";
import Log from "../../Logger";
import StringNamespaces from "../../constants/strings/StringNamespaces";
import Translator from "../../constants/strings/translator";
import * as MCUtil from "../../MCUtil";

const STRING_NS = StringNamespaces.REQUESTS;

namespace Requester {

    export async function requestProjectRestart(project: Project, startMode: StartModes): Promise<request.RequestPromise<any>> {
        const body = {
            startMode: startMode.toString()
        };

        const url = Endpoints.getProjectEndpoint(project.connection, project.id, Endpoints.RESTART_ACTION);
        const restartMsg = Translator.t(STRING_NS, "restartIntoMode", { startMode: getUserFriendlyStartMode(startMode) });
        return doProjectRequest(project, url, body, request.post, restartMsg);
    }

    export async function requestBuild(project: Project): Promise<void> {
        const body = {
            action: "build"         // non-nls
        };

        const url = Endpoints.getProjectEndpoint(project.connection, project.id, Endpoints.BUILD_ACTION);
        // return doProjectRequest(project, url, body, request.post, "Build");
        const buildMsg = Translator.t(STRING_NS, "build");
        return doProjectRequest(project, url, body, request.post, buildMsg)
            // This is a workaround for the Build action not refreshing validation state.
            // Will be fixed by https://github.ibm.com/dev-ex/iterative-dev/issues/530
            .then( () => requestValidate(project, true));
    }

    export async function requestToggleAutoBuild(project: Project): Promise<void> {
        const newAutoBuild: boolean = !project.autoBuildEnabled;

        // user-friendly action
        const autoBuildMsgKey = newAutoBuild ? "autoBuildEnable" : "autoBuildDisable";                  // non-nls
        const newAutoBuildUserStr: string = Translator.t(STRING_NS, autoBuildMsgKey);

        // action we'll put into the request body   https://github.ibm.com/dev-ex/portal/wiki/API:-Build
        const newAutoBuildAction:  string = newAutoBuild ? "enableautobuild" : "disableautobuild";     // non-nls

        const body = {
            action: newAutoBuildAction
        };

        const url = Endpoints.getProjectEndpoint(project.connection, project.id, Endpoints.BUILD_ACTION);
        return doProjectRequest(project, url, body, request.post, newAutoBuildUserStr)
            .then( (result: any) => {
                if (result != null && MCUtil.isGoodStatusCode(result.statusCode)) {
                    Log.d("Received good status from autoBuild request, new auto build is: " + newAutoBuild);
                    project.setAutoBuild(newAutoBuild);
                }
            });
    }

    export async function requestToggleEnablement(project: Project): Promise<void> {
        const newEnablement: boolean = !project.state.isEnabled;

        const newEnablementMsgKey = newEnablement ? "projectEnable" : "projectDisable";        // non-nls
        const newEnablementStr: string = Translator.t(STRING_NS, newEnablementMsgKey);

        const url = Endpoints.getProjectEndpoint(project.connection, project.id, Endpoints.getEnablementAction(newEnablement));
        return doProjectRequest(project, url, {}, request.put, newEnablementStr);
    }

    export async function requestValidate(project: Project, silent: boolean): Promise<void> {
        const body = {
            projectID: project.id,
            projectType: project.type.internalType
        };

        const url = Endpoints.getEndpoint(project.connection, Endpoints.VALIDATE_ACTION);
        const userOperation = silent ? undefined : Translator.t(StringNamespaces.CMD_MISC, "validate");
        return doProjectRequest(project, url, body, request.post, userOperation);
    }

    export async function requestGenerate(project: Project): Promise<void> {
        const body = {
            projectID: project.id,
            projectType: project.type.internalType,
            autoGenerate: true
        };

        const url = Endpoints.getEndpoint(project.connection, Endpoints.GENERATE_ACTION);
        const generateMsg = Translator.t(STRING_NS, "generateMissingFiles");

        return doProjectRequest(project, url, body, request.post, generateMsg)
            // request a validate after the generate so that the validation errors go away faster
            .then( () => requestValidate(project, true));
    }

    export async function requestDelete(project: Project): Promise<void> {
        const url = Endpoints.getProjectEndpoint(project.connection, project.id, "");
        const deleteMsg = Translator.t(STRING_NS, "delete");
        return doProjectRequest(project, url, {}, request.delete, deleteMsg);
    }

    /**
     * Perform a REST request of the type specific by `requestFunc` to the project endpoint for the given project.
     * Displays a message to the user that the request succeeded if userOperationName is not null.
     * Always displays a message to the user in the case of an error.
     */
    async function doProjectRequest(
            project: Project, url: string, body: {},
            requestFunc: (uri: string, options: request.RequestPromiseOptions) => request.RequestPromise<any>,
            userOperationName?: string): Promise<any> {

        Log.i(`Doing ${userOperationName != null ? userOperationName + " " : ""}request to ${url}`);

        const options = {
            json: true,
            body: body,
            resolveWithFullResponse: true
        };

        return requestFunc(url, options)
            .then( (result: any) => {
                Log.i(`Response code ${result.statusCode} from ${userOperationName} request for ${project.name}:`, result);
                if (userOperationName != null) {
                    vscode.window.showInformationMessage(
                        Translator.t(STRING_NS, "requestSuccess",
                        { operationName: userOperationName, projectName: project.name })
                    );
                }
                return result;
            })
            .catch( (err: any) => {
                Log.w(`Error doing ${userOperationName} project request for ${project.name}:`, err);

                // If the server provided a specific message, present the user with that,
                // otherwise show them the whole error (but it will be ugly)
                const errMsg = err.error ? err.error : err;
                vscode.window.showErrorMessage(
                    Translator.t(STRING_NS, "requestFail",
                    { operationName: userOperationName, projectName: project.name, err: errMsg })
                );
                return err;
            });
    }
}

export default Requester;
