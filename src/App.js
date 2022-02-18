import Gantt from "./Gannt";

let rootStyle = {
    width: "100vw",
    height: "100vh"
};

let tasks = {
    data: [
        {
            id: 1,
            text: "Project #2",
            start_date: "01-04-2018", 
            duration: 18,
            progress: 0.4,
            open: true
        },
        {
            id: 2,
            text: "Task #1",
            start_date: "02-04-2018",
            duration: 8,
            progress: 0.6,
            parent: 1
        },
        {
            id: 3,
            text: "Task #2",
            start_date: "11-04-2018", 
            duration: 8,
            progress: 0.6,
            parent :1
        }
    ],
    links: [
        {
            id: 1,
            source: 1,
            target: 2,
            type: "1"
        },
        {
            id: 2,
            source: 2,
            target: 3,
            type: "0"
        }
    ]
}
function App() {
  return (

    <div style={rootStyle} >

        <Gantt
            
            id="gantt_here"
            tasks={tasks}
            style={{ width: "100%", height: "100%" }}

        />

    </div>

  );
}

export default App;
