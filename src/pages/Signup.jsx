import React from "react";
import { useState } from "react";
import {useNavigate} from 'react-router-dom';
function Signup(){
    const [role,setRole] = useState('');
    const [name,setName] = useState('');
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [age,setAge] = useState(0);
    const [gender,setGender] = useState('');
    const [specialization,setSpecialization] = useState('');
    const navigate = useNavigate();
    async function handleClick(){
        if(role === 'patient'){
            const response = await fetch('http://localhost:8000/signup',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({
                    role:role,
                    name:name,
                    email:email,
                    password:password,
                    age:age,
                    gender:gender
                })
            });
            console.log(response);
            localStorage.setItem('token',response.token);
            localStorage.setItem('role',response.role);
                navigate('/patient/dashboard');
            
        } else if(role === 'doctor'){
            const reponse = await fetch('http://localhost:8000/signup',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({
                    role:role,
                    name:name,
                    email:email,
                    password:password,
                    specialization:specialization
                })
            });
            localStorage.setItem('token',response.token);
            localStorage.setItem('role',response.role);
            navigate('/doctor/dashboard');
        }
    }
    return(
        <>
        <h1>Signup</h1>
        <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
        </select>
        {role === 'patient' && (
            <>
                <input type="text" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)}/>
                <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
                <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
                <input type="number" placeholder="Age" value={age} onChange={(e)=>setAge(e.target.value)}/>
                <input type="text" placeholder="Gender" value={gender} onChange={(e)=>setGender(e.target.value)}/>
            </>
        )}
        {role === 'doctor' && (
            <>
                <input type="text" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)}/>
                <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
                <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
                <input type="text" placeholder="Specialization" value={specialization} onChange={(e)=>setSpecialization(e.target.value)}/>
            </>
        )}
        <button onClick={handleClick}>Signup</button>
        <button onClick={()=>{navigate("/")}}>Signin now</button>
        </>
    )
}
export default Signup;