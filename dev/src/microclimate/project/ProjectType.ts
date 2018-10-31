import * as Resources from "../../constants/Resources";
import Logger from "../../Logger";

export class ProjectType {

    public readonly type: ProjectType.Types;
    public readonly userFriendlyType: string;
    public readonly debugType: ProjectType.DebugTypes | undefined;

    public readonly icon: Resources.IconPaths;

    constructor(
        public readonly internalType: string,
        public readonly language: string,
    ) {
        this.type = ProjectType.getType(internalType, language);
        this.userFriendlyType = ProjectType.getUserFriendlyType(this.type);
        this.debugType = ProjectType.getDebugType(this.type);
        this.icon = ProjectType.getProjectIcon(this.type);
    }

    public toString(): string {
        return this.userFriendlyType;
    }

    /**
     *
     * @param projectType A Microclimate internal project type.
     */
    private static getType(projectType: string, language: string): ProjectType.Types {
        if (projectType === "liberty") {
            return ProjectType.Types.MICROPROFILE;
        }
        else if (projectType === "spring") {
            return ProjectType.Types.SPRING;
        }
        else if (projectType === "nodejs") {
            return ProjectType.Types.NODE;
        }
        else if (projectType === "swift") {
            return ProjectType.Types.SWIFT;
        }
        else if (projectType === "docker") {
            if (language === "python") {
                return ProjectType.Types.PYTHON;
            }
            else if (language === "go") {
                return ProjectType.Types.GO;
            }
            else {
                return ProjectType.Types.GENERIC_DOCKER;
            }
        }
        else {
            Logger.logE(`Unrecognized project - type ${projectType}`);
            return ProjectType.Types.UNKNOWN;
        }
    }

    /**
     * Get the corresponding VSCode debug configuration "type" value.
     * Returns undefined if we don't know how to debug this project type.
     */
    private static getDebugType(type: ProjectType.Types): ProjectType.DebugTypes | undefined {
        switch(type) {
            case ProjectType.Types.MICROPROFILE:
            case ProjectType.Types.SPRING:
                return this.DebugTypes.JAVA;
            case ProjectType.Types.NODE:
                return this.DebugTypes.NODE;
            default:
                return undefined;
        }
    }

    private static getProjectIcon(type: ProjectType.Types): Resources.IconPaths {
        // Right now these are stolen from https://github.com/Microsoft/vscode/tree/master/resources
        switch (type) {
            case ProjectType.Types.MICROPROFILE:
                return Resources.getIconPaths(Resources.Icons.Microprofile);
            case ProjectType.Types.SPRING:
                return Resources.getIconPaths(Resources.Icons.Spring);
            case ProjectType.Types.NODE:
                return Resources.getIconPaths(Resources.Icons.Node);
            case ProjectType.Types.SWIFT:
                return Resources.getIconPaths(Resources.Icons.Swift);
            case ProjectType.Types.PYTHON:
                return Resources.getIconPaths(Resources.Icons.Python);
            case ProjectType.Types.GO:
                return Resources.getIconPaths(Resources.Icons.Go);
            case ProjectType.Types.GENERIC_DOCKER:
                // This is our fall-back, we could possibly use a more generic icon.
                return Resources.getIconPaths(Resources.Icons.Docker);
            default:
                return Resources.getIconPaths(Resources.Icons.Generic);
        }
    }

    private static getUserFriendlyType(type: ProjectType.Types): string {
        // For docker projects, return the language
        /*
        if (type === ProjectType.Types.GENERIC_DOCKER && language != null) {
            return uppercaseFirstChar(language);
        }*/

        // For all other types, the enum's string value is user-friendly
        return type.toString();
    }

    public get providesBuildLog(): Boolean {
        return ProjectType.PROJECTS_WITHOUT_BUILDLOGS.indexOf(this.type) < 0;
    }
}

export namespace ProjectType {

    export enum Types {
        // String value must be user-friendly!
        MICROPROFILE = "Microprofile",
        SPRING = "Spring",
        NODE = "Node.js",
        SWIFT = "Swift",
        PYTHON = "Python",
        GO = "Go",
        GENERIC_DOCKER = "Docker",
        UNKNOWN = "Unknown"
    }

    export enum DebugTypes {
        JAVA = "java",
        NODE = "node"
    }

    export const PROJECTS_WITHOUT_BUILDLOGS: ReadonlyArray<ProjectType.Types> = [
        ProjectType.Types.NODE
    ];
}

export default ProjectType;