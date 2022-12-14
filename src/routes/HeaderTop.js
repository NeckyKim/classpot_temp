import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { dbService } from "../FirebaseModules";
import { collection, documentId } from "firebase/firestore";
import { onSnapshot, query, where } from "firebase/firestore";

import styles from "./HeaderTop.module.css";



function HeaderTop({ userObject }) {
    const [currentUserData, setCurrentUserData] = useState([]);

    // 사용자 정보 불러오기
    useEffect(() => {
        const myQuery = query(
            collection(dbService, "users"),
            where(documentId(), "==", userObject.uid),
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => ({
                name: current.name,
                userType: current.userType,
                profileIcon: current.profileIcon,

                ...current.data()
            }));

            setCurrentUserData(tempArray[0]);
        });
    }, [])



    



    return (
        <div className={styles.container}>
            <Link to="/" style={{ textDecoration: "none" }}>
                <img alt="icon" className={styles.homeButton} src={process.env.PUBLIC_URL + "/logo/classpot_blue.png"} />
            </Link>

            {
                currentUserData?.userType

                &&
                
                <Link to="/profile" style={{ textDecoration: "none" }}>
                    <img alt="home" className={styles.profileIcon} src={process.env.PUBLIC_URL + "/profile/" + currentUserData.profileIcon + ".png"} />
                </Link>
            }
        </div>
    )
}

export default HeaderTop;