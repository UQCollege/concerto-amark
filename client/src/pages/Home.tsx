import { useAppSelector } from "../store/hooks";



const Home = () => {
    const user=useAppSelector((state)=> state.auth.user)
  

    return (
        <div className="w-full mx-auto">
            <h1>

            Welcome back {user}
            </h1>

        </div >


    )
}

export default Home;