import { Outlet } from "react-router"
import Nav from "./ui/Nav"
const Root=()=>{
    return <div>
        <Nav></Nav>
        <main><Outlet/></main>
        </div>
}

export default Root