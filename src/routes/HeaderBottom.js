import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import styles from "./HeaderBottom.module.css"

function HeaderBottom({ className, classCode, testName, testCode }) {
    const [scrollPosition, setScrollPosition] = useState(0);

    const updateScroll = () => {
        setScrollPosition(window.scrollY || document.documentElement.scrollTop);
    };

    useEffect(() => {
        window.addEventListener("scroll", updateScroll);
    });



    return (
        <div className={scrollPosition < 10 ? styles.container : styles.containerScrolled}>
            <div className={styles.headerInfo}>

                <Link to={"/class/" + classCode} style={{ textDecoration: "none" }}>
                    <span className={styles.className}>
                        {className}
                    </span>
                </Link>


                {
                    testName

                    &&

                    <Link to={"/class/" + classCode + "/test/" + testCode} style={{ textDecoration: "none" }}>
                        <span className={styles.testName}>
                            {testName}
                        </span>
                    </Link>
                }
            </div>
        </div >
    )
}

export default HeaderBottom;