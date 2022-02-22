/* eslint-disable react-hooks/exhaustive-deps */
import { gantt } from "dhtmlx-gantt";
import { useEffect } from "react";

import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import 'dhtmlx-gantt/codebase/skins/dhtmlxgantt_material.css';

import './Gantt.css';

function Gantt ( props ) {

    const { id, tasks, resources, getCapacity, ...others } = props;    

    let events = [];

    useEffect ( () => {

		events.push ( gantt.attachEvent ( "onGanttReady", function () {
            
			var resourcesStore = gantt.getDatastore ( gantt.config.resource_store );

			if ( ! resourcesStore ) {

				return;

			}

			var filterValue;

			function selectResource () {

				var node = this;

				filterValue = node.value;

				gantt.render ();

			}

			events.push ( resourcesStore.attachEvent ( "onFilterItem", function ( id, item ) {

				if ( !filterValue ) {

					return true;

				}

				if ( id === filterValue ) {

					if ( item.parent ) {

						var parentItem = resourcesStore.getItem ( item.parent );

						if ( ! parentItem.$open ) {

							resourcesStore.open ( item.parent );

						}

					}

					return true;

				} else if ( resourcesStore.isChildOf ( id, filterValue ) ) {

					return true;

				} else {

					return false;

				}

			} ) );

			function updateSelect ( options ) {

				if ( ! gantt.$container ) {

					filterValue = null;

					return;

				}

				var select = gantt.$container.querySelector ( ".resource-select" );
				var html = [];

				html.push ( "<option value=''>All</option>" );
				options.forEach(function ( option ) {

					html.push ( "<option value='" + option.id + "'>" + option.text + "</option>" );

				} );

				select.innerHTML = html.join ( "" );
				select.value = filterValue || "";

			}

			events.push ( resourcesStore.attachEvent ( "onParse", function () {

				updateSelect ( resourcesStore.getItems () );

			} ) );

			var select = gantt.$container.querySelector ( ".resource-select" );
			select.onchange = selectResource;

		} ) );

        gantt.clearAll ();

		gantt.plugins ( {

			grouping: true,
			auto_scheduling: true

		} );

		var UNASSIGNED_ID = 5;
		var WORK_DAY = 8;

		function shouldHighlightTask ( task ) {

			var store = gantt.$resourcesStore;
			var taskResource = task[gantt.config.resource_property],
				selectedResource = store.getSelectedId ();

			if ( taskResource === selectedResource || store.isChildOf ( taskResource, selectedResource ) ) {

				return true;

			}

		}

		gantt.templates.grid_row_class = function ( start, end, task ) {

			var css = [];

			if ( gantt.hasChild ( task.id ) ) {

				css.push ( "folder_row" );

			}

			if ( task.$virtual ) {

				css.push ( "group_row" )

			}

			if ( shouldHighlightTask ( task ) ) {

				css.push ( "highlighted_resource" );

			}

			return css.join ( " " );

		};

		gantt.templates.task_row_class = function ( start, end, task ) {

			if ( shouldHighlightTask ( task ) ) {

				return "highlighted_resource";

			}

			return "";

		};

		gantt.templates.timeline_cell_class = function ( task, date ) {

			if ( ! gantt.isWorkTime ( { date: date, task: task } ) )
				return "week_end";

			return "";

		};

		function getAllocatedValue ( tasks, resource ) {

			var result = 0;

			tasks.forEach ( function ( item ) {

				var assignments = gantt.getResourceAssignments ( resource.id, item.id );

				assignments.forEach ( function ( assignment ) {
                    
					result += Number ( assignment.value );

				} );

			} );
            
			return result;

		}

		gantt.templates.histogram_cell_class = function ( start_date, end_date, resource, tasks ) {

			if ( getAllocatedValue(tasks, resource) > ( getCapacity ? getCapacity (start_date, resource) : 8 ) ) {

				return "column_overload";

			}

		};

		gantt.templates.histogram_cell_label = function ( start_date, end_date, resource, tasks ) {
            
			if ( tasks.length && !gantt.$resourcesStore.hasChild ( resource.id ) ) {

				return getAllocatedValue(tasks, resource) + "/" + ( getCapacity ? getCapacity (start_date, resource) : 8 );

			} else {

				if ( !gantt.$resourcesStore.hasChild ( resource.id ) ) {

					return '&ndash;';

				}

				return '';

			}

		};

		gantt.templates.histogram_cell_allocated = function ( start_date, end_date, resource, tasks ) {

			return getAllocatedValue ( tasks, resource );

		};

		gantt.templates.histogram_cell_capacity = function ( start_date, end_date, resource, tasks ) {

			if ( !gantt.isWorkTime ( start_date ) ) {

				return 0;

			}

			return ( getCapacity ? getCapacity ( start_date, resource ) : 8  );

		};

		function shouldHighlightResource ( resource ) {

			var selectedTaskId = gantt.getState ().selected_task;

			if ( gantt.isTaskExists ( selectedTaskId ) ) {

				var selectedTask = gantt.getTask ( selectedTaskId ),
					selectedResource = selectedTask[ gantt.config.resource_property ];

				if ( resource.id === selectedResource ) {

					return true;

				} else if ( gantt.$resourcesStore.isChildOf ( selectedResource, resource.id ) ) {

					return true;

				}

			}

			return false;

		}

		var resourceTemplates = {

			grid_row_class: function ( start, end, resource ) {

				var css = [];

				if ( gantt.$resourcesStore.hasChild ( resource.id ) ) {

					css.push ( "folder_row" );                    
					css.push ( "group_row" );

				}

				if ( shouldHighlightResource ( resource ) ) {

					css.push ( "highlighted_resource" );

				}

				return css.join ( " " );

			},

			task_row_class: function ( start, end, resource ) {

				var css = [];

				if ( shouldHighlightResource ( resource ) ) {

					css.push ( "highlighted_resource" );

				}

				if ( gantt.$resourcesStore.hasChild ( resource.id ) ) {

					css.push ( "group_row" );

				}

				return css.join ( " " );

			}

		};

		gantt.locale.labels.section_owner = "Owner";

		gantt.config.lightbox.sections = [

			{

                name: "description",
                height: 38,
                map_to: "text",
                type: "textarea",
                focus: true

            },
			{

                name: "owner",
                type: "resources",
                map_to: "owner",
                default_value: WORK_DAY,
                unassigned_value: UNASSIGNED_ID

            },
			{

                name: "time",
                type: "duration",
                map_to: "auto"

            }

		];

		gantt.config.resource_render_empty_cells = true;

		function getResourceAssignments ( resourceId ) {

			var assignments;
			var store = gantt.getDatastore ( gantt.config.resource_store );

			if ( store.hasChild ( resourceId ) ) {

				assignments = [];

				store.getChildren ( resourceId ).forEach ( function ( childId ) {

					assignments = assignments.concat ( gantt.getResourceAssignments ( childId ) );

				} );

			} else {

				assignments = gantt.getResourceAssignments ( resourceId );

			}

			return assignments;

		}

		var resourceConfig = {

			scale_height: 30,
			row_height: 45,
			scales: [

				{

                    unit: "day",
                    step: 1,
                    date: "%d %M"

                }

			],
			columns: [

				{

					name: "name",
                    label: "Name",
                    tree:true,
                    width:200,
                    template: function ( resource ) {

						return resource.text;

					},
                    resize: true

				},
				{

					name: "progress",
                    label: "Complete",
                    align:"center",
                    template: function ( resource ) {

						// var store = gantt.getDatastore ( gantt.config.resource_store );
						var totalToDo = 0,
							totalDone = 0;

						var assignments = getResourceAssignments ( resource.id );

						assignments.forEach ( function ( assignment ) {

							var task = gantt.getTask ( assignment.task_id );

							totalToDo += task.duration;
							totalDone += task.duration * ( task.progress || 0 );

						} );

						var completion = 0;

						if ( totalToDo ) {

							completion = ( totalDone / totalToDo ) * 100;

						}

						return Math.floor ( completion ) + "%";

					},
                    resize: true

				},
				{

					name: "workload",
                    label: "Workload",
                    align:"center",
                    template: function ( resource ) {

						var totalDuration = 0;
						var assignments = getResourceAssignments ( resource.id );

						assignments.forEach ( function ( assignment ) {

							var task = gantt.getTask ( assignment.task_id );

							totalDuration += Number ( assignment.value ) * task.duration;

						} );

						return ( totalDuration || 0 ) + "h";

					},
                    resize: true

				},
				{

					name: "capacity",
                    label: "Capacity",
                    align:"center",
                    template: function ( resource ) {

						var store = gantt.getDatastore ( gantt.config.resource_store );
						var n = store.hasChild ( resource.id ) ? store.getChildren ( resource.id ).length : 1

						var state = gantt.getState ();

						return gantt.calculateDuration ( state.min_date, state.max_date)  * n * WORK_DAY + "h";

					}

				}

			]
		};

		gantt.config.scales = [

			{

                unit: "month",
                step: 1,
                format: "%F, %Y"

            },
			{
                unit: "day",
                step: 1,
                format: "%d %M"

            }

		];

		gantt.config.auto_scheduling = true;
		gantt.config.auto_scheduling_strict = true;
		gantt.config.work_time = true;
		gantt.config.columns = [

			{
                name: "text",
                label: "수주 번호",
                tree: true,
                width: 200,
                resize: true

            },
			{

                name: "start_date",
                align: "center",
                width: 80,
                resize: true

            },
			{
                name: "owner",
                align: "center",
                width: 80,
                label: "Owner",
                template: function ( task ) {

				    if ( task.type === gantt.config.types.project ) {

					    return "";

				    }

                    var store = gantt.getDatastore ( "resource" );
                    var assignments = task[ gantt.config.resource_property ];

                    if ( ! assignments || ! assignments.length ) {

                        return "Unassigned";

                    }

                    if ( assignments.length === 1 ) {

                        return store.getItem ( assignments[0].resource_id ).text;

                    }

                    var result = "";
                    
                    assignments.forEach ( function ( assignment ) {

                        var owner = store.getItem ( assignment.resource_id );

                        if ( ! owner )
                            return;

                        result += "<div class='owner-label' title='" + owner.text + "'>" + owner.text.substr ( 0, 1 ) + "</div>";

				    } );

				    return result;

			    },
                resize: true

            },
			{

                name: "duration",
                width: 60,
                align: "center",
                resize: true

            },
            {

                name: "test",
                label: "테스트",
                width: 60,
                align: "center",
                template: function (task) {
                    return task.test;
                },
                resize: true

            },
			{

                name: "add",
                width: 44

            }
		];

		gantt.config.resource_store = "resource";
		gantt.config.resource_property = "owner";
		gantt.config.order_branch = true;
		gantt.config.open_tree_initially = true;
		gantt.config.scale_height = 50;
		gantt.config.layout = {

			css: "gantt_container",
			rows: [

				{

					gravity: 2,
					cols: [

						{
                            view: "grid",
                            group:"grids",
                            scrollY: "scrollVer"

                        },
						{

                            resizer: true,
                            width: 1

                        },
						{

                            view: "timeline",
                            scrollX: "scrollHor",
                            scrollY: "scrollVer"

                        },
						{
                            
                            view: "scrollbar",
                            id: "scrollVer",
                            group:"vertical"
                        
                        }

					]

				},
				{
                    
                    resizer: true,
                    width: 1,
                    next: "resources"
                
                },
				{
					
                    height: 35,
					cols: [

						{

                            html: "<label>Resource<select class='resource-select'></select>",
                            css: "resource-select-panel",
                            group: "grids"

                        },
						{

                            resizer: true,
                            width: 1

                        },
						{
                            
                            html: ""
                        
                        }

					]

				},
				{

					gravity:1,
					id: "resources",
					config: resourceConfig,
					templates: resourceTemplates,
					cols: [

						{
                            view: "resourceGrid",
                            group:"grids",
                            scrollY: "resourceVScroll"

                        },
						{

                            resizer: true,
                            width: 1

                        },
						{
                            
                            view: "resourceHistogram",
                            capacity:24,
                            scrollX: "scrollHor",
                            scrollY: "resourceVScroll"
                        
                        },
						{
                            
                            view: "scrollbar",
                            id: "resourceVScroll",
                            group: "vertical"
                        
                        }

					]

				},
				{

                    view: "scrollbar",
                    id: "scrollHor"

                }

			]

		};

		gantt.$resourcesStore = gantt.createDatastore ( {

			name: gantt.config.resource_store,
			type: "treeDatastore",
			initItem: function ( item ) {

				item.parent = item.parent || gantt.config.root_id;
				item[gantt.config.resource_property] = item.parent;
				item.open = true;

				return item;

			}

		} );

		events.push ( gantt.$resourcesStore.attachEvent ( "onAfterSelect", function ( id ) {

			gantt.refreshData ();

		} ) );;

		gantt.init ( "gantt_here" );

		events.push ( gantt.attachEvent ( "onTaskLoading", function ( task ) {

			var ownerValue = task[ gantt.config.resource_property ];

			if ( ! task.$virtual && ( ! ownerValue || ! Array.isArray ( ownerValue ) || ! ownerValue.length ) ) {

				task[gantt.config.resource_property] = [ { resource_id: 5, value:0 } ]; //'Unassigned' group

			}

			return true;

		} ) );

		function toggleGroups ( input ) {

			gantt.$groupMode = !gantt.$groupMode;

			if ( gantt.$groupMode ) {

				if ( input ) {
                    
                    input.value = "show gantt view";

                }

				var groups = gantt.$resourcesStore.getItems ().map ( function ( item ) {

					var group = gantt.copy ( item );

					group.group_id = group.id;
					group.id = gantt.uid ();

					return group;

				} );

				gantt.groupBy ( {

					groups: groups,
					relation_property: gantt.config.resource_property,
					group_id: "group_id",
					group_text: "text",
					delimiter: ", ",
					default_group_label: "Not Assigned"

				} );

			} else {

                if ( input ) {

                    input.value = "show resource view";

                }

				gantt.groupBy ( false );

			}

		}

		events.push ( gantt.$resourcesStore.attachEvent ( "onParse", function () {

			var people = [];

			gantt.$resourcesStore.eachItem ( function ( res ) {

				if ( ! gantt.$resourcesStore.hasChild ( res.id ) ) {

					var copy = gantt.copy ( res );

					copy.key = res.id;
					copy.label = res.text;
					copy.unit = "hours";
					people.push ( copy );

				}

			} );

			gantt.updateCollection ( "people", people );

		} ) );

        events.push ( gantt.attachEvent ( "onBeforeLinkAdd", function ( id, mode, e ) {

            return false;

        } ) );

        events.push ( gantt.attachEvent ( "onBeforeLinkDelete", function ( id, mode, e ) {

            return false;

        } ) );

        events.push ( gantt.attachEvent ( "onBeforeLinkUpdate", function ( id, mode, e ) {

            return false;

        } ) );


        events.push ( gantt.attachEvent ( "onBeforeTaskDrag", function ( id, mode, e ) {

            // disable drag progress
            
            if ( mode === "progress" ) {

                return false;

            }

            console.log ( mode );

            return true;

        } ) );

		gantt.$resourcesStore.parse ( resources );

		gantt.parse ( tasks );
        gantt.render ();

        return (

            () => {

                gantt.clearAll ();

                while ( events.length ) {
                    
                    gantt.detachEvent ( events.pop() );

                }

            }

        );

    }, [tasks] )

    return (

        <div

            id={ id }
            {...others}

        >
        </div>

    )

}

export default Gantt;

