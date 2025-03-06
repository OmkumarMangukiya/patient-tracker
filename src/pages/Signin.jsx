import { useState } from "react";
import {useNavigate} from 'react-router-dom';
function Signin(){
    const [role,setRole] = useState('');
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const navigate = useNavigate();
    function handleClick(){
        fetch('http://localhost:8000/signin',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                role:role,
                email:email,
                password:password
            })
        });
    }
    return(
        <>
        <h1>Signin</h1>
        <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
        </select>
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
        <button onClick={handleClick}>Signin</button>
        <button onClick={()=>{navigate("/signup")}}> Signin</button>
        </>
    )
}
export default Signin;