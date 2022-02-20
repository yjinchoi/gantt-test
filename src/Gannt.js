/* eslint-disable react-hooks/exhaustive-deps */
import { gantt } from "dhtmlx-gantt";
import { useEffect } from "react";

import 'dhtmlx-gantt/codebase/skins/dhtmlxgantt_material.css';

function Gantt ( props ) {

    const { id, tasks, ...others } = props;

    useEffect ( () => {

        gantt.attachEvent("onBeforeLightbox", function(id) {

            let task = gantt.getTask ( id );

            if ( task.$new ) {

                gantt.deleteTask ( id );
                return false;

            }

            return false;

        });

        gantt.config.layout = {
            css: "gantt_container",
            rows:[
              {
                cols: [
                  {view: "grid", id: "grid", scrollX:"scrollHor", scrollY:"scrollVer"},
                  {view: "timeline", id: "timeline", scrollX:"scrollHor", scrollY:"scrollVer"},
                  {view: "scrollbar", scroll: "y", id:"scrollVer"}
                ]
               },
              {view: "scrollbar", scroll: "x", id:"scrollHor", height:20}
            ]
        };
        
        gantt.init ( id );
        gantt.parse ( tasks );

        return (

            () => gantt.detachAllEvents ()

        );

    }, [] );

    return (

        <div

            id={id}
            {...others}

        >
        </div>
    )

}

export default Gantt;

