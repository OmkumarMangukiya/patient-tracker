import React from "react";
import { useState } from "react";
import {useNavigate} from 'react-router-dom';
import axios from "axios";
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
            const response = await axios.post('http://localhost:8000/signup',{
                role:role,
                name:name,
                email:email,
                password:password,
                age:age,
                gender:gender,
            })
            localStorage.setItem('token',response.data.token);
            localStorage.setItem('role',response.data.role);
            navigate('/patient/dashboard');
            
        } else if(role === 'doctor'){
            const response = await axios.post('http://localhost:8000/signup',{
                role:role,
                name:name,
                email:email,
                password:password,
                specialization:specialization,
            })
            localStorage.setItem('token',response.data.token);
            localStorage.setItem('role',response.data.role);
            navigate('/doctor/dashboard');
        }
    }
    return(
        <div className="flex flex-col items-center p-4 bg-blue-200 min-h-screen">
        < h1 className="text-2xl font-bold text-black">Signup</h1>
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
        <button className='text-white bg-white border border-black px-4 py-2' onClick={handleClick}>Signup</button>
        <button className='text-white bg-white border border-black px-4 py-2' onClick={() => navigate("/signup")}>Signin now</button>
        </div>
    )
}
export default Signup;