import React, { useEffect, useState } from 'react';
import { Container } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from 'axios';

const UserScreen = () => {
    const [users, setUsers] = useState([]);
    const [userAdminValue, setUserAdminValue] = useState({});

    const columns = [
        { field: "id", headerName: "ID", width: 120 },
        {
            field: "name",
            headerName: "User Name",
            minWidth: 150,
            editable: false,
        },
        {
            field: "surname",
            headerName: "user Surname",
            minWidth: 150,
            editable: false,
        },
        {
            field: "email",
            headerName: "User Email",
            minWidth: 300,
            editable: false,
        },
        {
            field: "is_admin",
            headerName: "Is Admin?",
            minWidth: 150,
            renderCell: (params) => (
                <select defaultValue={userAdminValue[params.id]} style={{width: "100%", "padding": "0.5em", "borderRadius": "5px"}} onChange={e => handleUpdateAdmin(e, params.id)}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            ),
        },
    ];
    
    const handleUpdateAdmin = async (e, id) => {
        e.preventDefault();

        try {
            await axios.patch(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/user/${id}/set_user_admin/`, {is_admin: e.target.value === "true" ? 1 : 0}, {
                headers: {Authorization: localStorage.getItem("token")}
            })

            setUserAdminValue({...userAdminValue, [id]: e.target.value});
        } catch (error) {
            alert("Something went wrong updating user admin");
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {

            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/user/all`, {
                    headers: {Authorization: localStorage.getItem("token")}
                });

                setUsers(res.data);
                setUserAdminValue(res.data.reduce((acc, user) => {
                    acc[user.id] = user.is_admin === 1 ? "true" : "false";
                    return acc;
                }, {}));
            } catch (error) {
                alert("Something went wrong fetching users");
            }
        };

        fetchUsers();
    }, []);

    return (
        <Container maxWidth="xl" style={{ marginTop: "3em" }}>
            <DataGrid
                style={{ height: "100%", width: "100%" }}
                rows={users}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 10,
                        },
                    },
                }}
                pageSizeOptions={[10]}
                disableRowSelectionOnClick
            />
        </Container>
    );
};

export default UserScreen;