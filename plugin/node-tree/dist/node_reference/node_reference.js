"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));

const lib_node_tree_1 = __importStar(require("../@lib/lib_node_tree"));
const tool_1 = __importDefault(require("../tool"));
const reference_data_1 = __importDefault(require("./reference_data"));
const variable_name_1 = __importDefault(require("./variable_name"));
class node_reference {
    /**
     * 事件触发器（主进程）
     * @备注
     * 事件列表：顶部菜单/开发者/消息列表
     * @额外扩展
     * - load: 主进程加载
     * - unload: 主进程卸载
     */
    event = [
        {
            trigger_ss: ["asset-db:asset-change"],
            callback_f: (uuid_s_, data_) => {
                // console.log("资源变更", ...args_as);
                // if (data_.name.endsWith(".scene") || data_.name.endsWith(".prefab")) {
                // 	tool.call_scene_script("update_script");
                // }
            },
        },
    ];
    /** 菜单触发器（渲染进程） */
    menu = [
        {
            trigger_ss: ["node/关闭节点引用展示"],
            priority_n: 999,
            run_f: (node) => {
                return reference_data_1.default.target?.uuid === node.uuid;
            },
            callback_f: async () => {
                lib_node_tree_1.default.del(lib_node_tree_1.lib_node_tree_.extension_type.tail_left, "node-reference-name");
                /** 挂载脚本 */
                let script_path_s = await tool_1.default.call_scene_script("get_component_path", reference_data_1.default.target.path, reference_data_1.default.target.components.findIndex((v) => !v.type.startsWith("cc.")));
                await reference_data_1.default.encode(script_path_s);
                reference_data_1.default.target = null;
            },
        },
        {
            trigger_ss: ["node/开启节点引用展示"],
            priority_n: 999,
            run_f: (node) => {
                return node.components.filter((v) => !v.type.startsWith("cc.")).length > 0 && reference_data_1.default.target?.uuid !== node.uuid;
            },
            callback_f: async (node) => {
                // 打开现在的开关
                reference_data_1.default.target = node;
                /** 挂载脚本 */
                let script_path_s = await tool_1.default.call_scene_script("get_component_path", reference_data_1.default.target.path, reference_data_1.default.target.components.findIndex((v) => !v.type.startsWith("cc.")));
                await reference_data_1.default.decode(script_path_s);
                let create_f = (data) => {
                    let class_name_div = document.createElement("ui-checkbox");
                    /** 数据键 */
                    let key_s = `${data.node.uuid}`;
                    /** 引用数据 */
                    let node_data = reference_data_1.default.node_reference_tab[key_s];
                    /** 变量名 */
                    let variable_s = node_data?.name_s ?? "";
                    class_name_div.setAttribute("value", `${Boolean(variable_s)}`);
                    class_name_div.style.color = "aqua";
                    class_name_div.innerHTML = variable_s;
                    class_name_div.addEventListener("confirm", async (event) => {
                        let old_variable_s = variable_s;
                        // 取消勾选
                        if (variable_s.length) {
                            delete reference_data_1.default.node_reference_tab[key_s];
                            variable_s = "";
                        }
                        // 勾选
                        else {
                            variable_s = (0, variable_name_1.default)(data.node.name);
                            // 变量名无效
                            if (!variable_s.length) {
                                class_name_div.removeAttribute("checked");
                                console.warn("无法转换为变量名");
                            }
                        }
                        class_name_div.innerHTML = variable_s;
                        // 变量名重复
                        if (variable_s) {
                            for (let k_s in reference_data_1.default.node_reference_tab) {
                                if (reference_data_1.default.node_reference_tab[k_s].name_s === variable_s) {
                                    variable_s = "";
                                    class_name_div.innerHTML = variable_s;
                                    class_name_div.removeAttribute("checked");
                                    console.warn("变量名重复", reference_data_1.default.node_reference_tab[k_s].path_s);
                                    break;
                                }
                            }
                        }
                        // 标记节点
                        if (variable_s.length) {
                            reference_data_1.default.node_reference_tab[key_s] = null;
                        }
                        // 更新脚本
                        if (!(!old_variable_s && !variable_s)) {
                            await reference_data_1.default.encode(script_path_s);
                        }
                    });
                    return class_name_div;
                };
                lib_node_tree_1.default.add(lib_node_tree_1.lib_node_tree_.extension_type.tail_left, "node-reference-name", (data) => {
                    return data.node.path.startsWith(reference_data_1.default.target.path + "/");
                }, create_f);
            },
        },
    ];
    /**
     * 事件触发器（场景脚本）
     * @额外扩展
     * - load: 场景脚本加载
     * - unload: 场景脚本卸载
     */
    scene = [
        // 获取组件路径
        {
            trigger_ss: ["get_component_path"],
            callback_f: async (path_s_, index_n_) => {
                let node = cc.find(path_s_);
                if (!node) {
                    return "";
                }
                let path_s = await Editor.Message.request("asset-db", "query-path", node.components[index_n_].__scriptUuid);
                return path_s;
            },
        },
        // 获取节点信息
        {
            trigger_ss: ["get_node_info"],
            callback_f: async (node_tab_) => {
                // console.log("测试-场景", Editor);
                const node_info_tab = {};
                let get_node_info_f = async (node_) => {
                    if (node_.uuid in node_tab_) {
                        let path_s = node_[" INFO "].slice(node_[" INFO "].indexOf("path: ") + 6);
                        let component_ss = [];
                        for (let v of node_.components) {
                            let name_s = cc.js.getClassName(v);
                            if (name_s.startsWith("cc")) {
                                component_ss.push([name_s]);
                            }
                            else {
                                let component_path_s = await Editor.Message.request("asset-db", "query-path", v.__scriptUuid);
                                if (component_path_s) {
                                    component_ss.push([name_s, component_path_s]);
                                }
                            }
                        }
                        node_info_tab[node_.uuid] = [path_s, component_ss];
                    }
                    for (let v of node_.children) {
                        await get_node_info_f(v);
                    }
                };
                for (let v of cc.director.getScene().children) {
                    await get_node_info_f(v);
                }
                return node_info_tab;
            },
        },
        // 更新节点信息
        {
            trigger_ss: ["update_script"],
            callback_f: async () => {
                // tool.call_scene_script();
                // console.log("场景脚本", args, `cc(${Boolean(cc)})`);
                let get_script_f = async (node, component_ss = []) => {
                    if (!(node instanceof cc.Scene)) {
                        for (let v of node.components) {
                            let name_s = cc.js.getClassName(v);
                            if (name_s.startsWith("cc.")) {
                                continue;
                            }
                            let component_path_s = await Editor.Message.request("asset-db", "query-path", v.__scriptUuid);
                            if (!component_path_s) {
                                continue;
                            }
                            let info = reference_data_1.default.parse(component_path_s);
                            if (fs.existsSync(info.script_path_s)) {
                                let path_s = node[" INFO "].slice(node[" INFO "].indexOf("path: ") + 6);
                                component_ss.push([name_s, component_path_s, info.script_path_s, node.uuid, path_s]);
                            }
                        }
                    }
                    for (let v of node.children) {
                        if (node.name === "Editor Scene Foreground" || node.name === "Editor Scene Background") {
                            continue;
                        }
                        await get_script_f(v, component_ss);
                    }
                    return component_ss;
                };
                let script_as = await get_script_f(cc.director.getScene());
                for (let v_ss of script_as) {
                    reference_data_1.default.target = {
                        uuid: v_ss[3],
                        path: v_ss[4],
                        components: [],
                    };
                    if (!(await reference_data_1.default.decode(v_ss[1]))) {
                        continue;
                    }
                    await reference_data_1.default.encode(v_ss[1]);
                }
            },
        },
        // 获取 uuid 通过路径
        {
            trigger_ss: ["get_uuid_by_path"],
            callback_f: async (path_ss_) => {
                let root_node = cc.director.getScene();
                if (!root_node) {
                    return [];
                }
                if (cc.director.getScene()?.name === "New Node") {
                    root_node = cc.director.getScene().children[0];
                }
                return path_ss_.map((v_s) => root_node.getChildByPath(v_s)?.uuid ?? "");
            },
        },
    ];
}
exports.default = new node_reference();
