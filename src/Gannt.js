/* eslint-disable react-hooks/exhaustive-deps */
import { gantt } from "dhtmlx-gantt";
import { useEffect } from "react";

import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

function Gantt ( props ) {

    const { id, tasks, ...others } = props;

    useEffect ( () => {

        gantt.init ( id );
        gantt.parse ( tasks );

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

