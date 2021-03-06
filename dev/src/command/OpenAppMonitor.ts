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

import Project from "../microclimate/project/Project";
import { promptForProject } from "./CommandUtil";
import Log from "../Logger";
import Commands from "../constants/Commands";
import Endpoints from "../constants/Endpoints";

export default async function openAppMonitorCmd(project: Project): Promise<void> {
    Log.d("openAppMonitorCmd invoked");
    if (project == null) {
        const selected = await promptForProject();
        if (selected == null) {
            Log.d("User cancelled prompt for resource");
            // user cancelled
            return;
        }
        project = selected;
    }

    const monitorPageUrl: vscode.Uri = Endpoints.getAppMonitorUrl(project.connection, project.id);
    Log.i("Open monitor at " + monitorPageUrl);
    vscode.commands.executeCommand(Commands.VSC_OPEN, monitorPageUrl);
}
