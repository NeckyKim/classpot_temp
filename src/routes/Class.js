import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { dbService } from "../FirebaseModules";
import { collection, documentId, getDoc, getDocs } from "firebase/firestore";
import { doc, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onSnapshot, query, where, orderBy } from "firebase/firestore";

import HeaderBottom from "./HeaderBottom";

import styles from "./Class.module.css";



function Class({ userObject }) {
    // 사용자 정보 불러오기
    const [userData, setUserData] = useState([]);

    useEffect(() => {
        const myQuery = query(collection(dbService, "users"), where(documentId(), "==", userObject.uid));

        onSnapshot(query(collection(dbService, "users"), where(documentId(), "==", userObject.uid)), (snapshot) => {
            setUserData(snapshot.docs.map((current) => ({ ...current.data() }))[0]);
        });
    }, [])



    let { classCode } = useParams();

    const [tab, setTab] = useState(1);

    const [myClasses, setMyClasses] = useState([]);
    const [classInfo, setClassInfo] = useState([]);
    const [myTests, setMyTests] = useState([]);
    const [myStudentsList, setMyStudentsList] = useState([]);
    const [myStudentsInfo, setMyStudentsInfo] = useState([]);
    const [studentClassInfo, setStudentClassInfo] = useState([]);
    const [findingEmailResults, setFindingEmailResults] = useState([]);
    const [findingEmailMessage, setFindingEmailMessage] = useState("");

    const [isCreatingTest, setIsCreatingTest] = useState(false);
    const [inputTestName, setInputTestName] = useState("");
    const [inputTestDate, setInputTestDate] = useState("");
    const [inputTestTime, setInputTestTime] = useState("");
    const [inputFeedback, setInputFeedback] = useState(false);

    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [inputStudentEmail, setInputStudentEmail] = useState("");
    const [authenticateButton, setAuthenticateButton] = useState(false);




    // 자신이 생성한 강의인지 확인
    useEffect(() => {
        const myQuery = query(
            collection(dbService, "classes"),
            where("teacherId", "==", userObject.uid),
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => (
                current.id
            ));

            setMyClasses(tempArray);
        });
    }, [])



    // 강의 정보 
    useEffect(() => {
        const myQuery = query(
            collection(dbService, "classes"),
            where(documentId(), "==", classCode)
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => ({
                classCode: current.id,
                ...current.data()
            }));

            setClassInfo(tempArray[0]);
        });
    }, [])



    // 생성한 시험 정보 불러오기
    useEffect(() => {
        const myQuery = query(
            collection(dbService, "classes", classCode, "tests"),
            orderBy("testName", "asc")
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => ({
                id: current.id,
                ...current.data()
            }));

            setMyTests(tempArray);
        });
    }, [])



    // 추가한 학생 정보 불러오기
    useEffect(() => {
        const myQuery = query(
            collection(dbService, "classes", classCode, "students"),
            orderBy("studentId", "asc")
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => ({
                ...current.data()
            }));

            setMyStudentsList(tempArray);
        });
    }, [])

    useEffect(() => {
        for (var i = 0; i < myStudentsList.length; i++) {
            const myQuery = query(
                collection(dbService, "users"),
                where(documentId(), "==", myStudentsList[i].studentId)
            );

            onSnapshot(myQuery, (snapshot) => {
                const tempArray = snapshot.docs.map((current) => ({
                    ...current.data()
                }));

                setMyStudentsInfo(prev => [...prev, tempArray[0]]);
            });
        }
    }, [myStudentsList])



    // 학생이 자신의 강의 정보 불러오기
    useEffect(() => {
        const myQuery = query(
            collection(dbService, "classes", classCode, "students"),
            where(documentId(), "==", userObject.uid)
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => ({
                ...current.data()
            }));

            setStudentClassInfo(tempArray[0]);
        });
    }, [])



    function onChange(event) {
        const { target: { name, value } } = event;

        if (name === "testName") {
            setInputTestName(value);
        }

        else if (name === "studentEmail") {
            setInputStudentEmail(value);
        }

        else if (name === "testDate") {
            setInputTestDate(value);
        }

        else if (name === "testTime") {
            setInputTestTime(value);
        }
    }



    // 시험 생성하기
    async function createTest(event) {
        event.preventDefault();

        await addDoc(collection(dbService, "classes", classCode, "tests"), {
            testName: inputTestName,
            testDate: Date.parse(inputTestDate),
            testTime: inputTestTime,
            testFeedback: inputFeedback,
        });

        setIsCreatingTest(false);
        setInputTestName("");
    }



    // 이메일로 학생 찾기
    function findStudentByEmail(email) {
        const myQuery = query(
            collection(dbService, "users"),
            where("email", "==", email),
            where("userType", "==", "student")
        );

        onSnapshot(myQuery, (snapshot) => {
            const tempArray = snapshot.docs.map((current) => ({
                ...current.data()
            }));

            setFindingEmailResults(tempArray);

            if (inputStudentEmail !== "") {
                if (tempArray.length > 0) {
                    if (!(myStudentsInfo.map(row => row.email).includes("neckykim@gmail.com"))) {
                        setFindingEmailMessage("이메일이 확인되었습니다.");
                        setAuthenticateButton(true);
                    }

                    else {
                        setFindingEmailMessage("이미 추가된 학생입니다.");
                        setAuthenticateButton(false);
                    }
                }

                else {
                    setFindingEmailMessage("존재하지 않는 이메일입니다.");
                    setAuthenticateButton(false);
                }
            }

            else {
                setFindingEmailMessage("이메일을 입력하세요.");
                setAuthenticateButton(false);
            }
        });
    }



    async function addStudent(event) {
        event.preventDefault();

        try {
            await setDoc(doc(dbService, "classes", classCode, "students", findingEmailResults[0]?.userId), {
                studentId: findingEmailResults[0]?.userId,
                authenticate: false,
            });

            await setDoc(doc(dbService, "users", findingEmailResults[0]?.userId, "classes", classCode), {
                classCode: classCode,
                authenticate: false,
            });

            setIsAddingStudent(false);
            setInputStudentEmail("");
            setFindingEmailResults([]);
            setAuthenticateButton(false);

            alert("학생에게 인증을 요청했습니다.")
        }

        catch (error) {
            alert(error);
        }

    }



    async function deleteStudent(studentId) {
        const ok = window.confirm("해당 학생을 삭제하시겠습니까?")

        if (ok) {
            await deleteDoc(doc(dbService, "classes", classCode, "students", studentId));
            await deleteDoc(doc(dbService, "users", studentId, "classes", classCode));
        }
    }



    async function acceptAuthenticate() {
        await updateDoc(doc(dbService, "classes", classCode, "students", userObject.uid), {
            authenticate: true,
        });

        await updateDoc(doc(dbService, "users", userObject.uid, "classes", classCode), {
            authenticate: true,
        });
    }

    console.log(myStudentsList)

    return (
        <div className={styles.classContainer}>
            <HeaderBottom className={classInfo?.className} classCode={classInfo?.classCode} />

            {
                myClasses.includes(classCode) && userData?.userType === "teacher"

                    ?

                    // 강사 전용 화면
                    <div>

                        {/* 메뉴 탭 */}
                        <div className={styles.tabButtonZone}>
                            <button
                                className={tab === 1 ? styles.tabOn : styles.tabOff}
                                onClick={() => { setTab(1) }}>
                                학생
                            </button>

                            <button
                                className={tab === 2 ? styles.tabOn : styles.tabOff}
                                onClick={() => { setTab(2) }}>
                                시험
                            </button>
                        </div>

                        {
                            tab === 1

                            &&

                            // 학생 관리 화면
                            <div>
                                {
                                    myStudentsList.map((current) => {
                                        <div>
                                            {current.authenticate ? "참" : "거짓"}
                                        </div>
                                    })
                                }

                                {
                                    myStudentsInfo.map((current) => (
                                        <div className={styles.studentElementsZone}>
                                            <div className={styles.studentName}>
                                                {current.name}
                                            </div>

                                            <div className={styles.studentEmail}>
                                                {current.email}
                                            </div>

                                            <button
                                                className={styles.deleteStudentButton}
                                                onClick={() => {
                                                    deleteStudent(current.studentId);
                                                }}>
                                                삭제
                                            </button>
                                        </div>
                                    ))
                                }

                                <button
                                    className={styles.addButton}
                                    onClick={() => {
                                        setIsCreatingTest(false);
                                        setIsAddingStudent(true);
                                    }}>
                                    학생 추가하기
                                    <img alt="home" src={process.env.PUBLIC_URL + "/icon/add.png"} />
                                </button>


                                {/* 학생 추가 화면 */}
                                {
                                    isAddingStudent

                                    &&

                                    <div className={styles.addBackground}>
                                        <div className={styles.addContainer}>
                                            <div className={styles.addStudentComment}>
                                                강의에 추가할 학생의 이메일을 입력하고, <span className={styles.addStudentCommentHighlight}>이메일 찾기</span> 버튼을 누르세요.<br />

                                                이메일이 존재하는 경우, <span className={styles.addStudentCommentHighlight}>학생 인증 요청</span> 버튼을 눌러서 학생에게 인증을 요청합니다.<br />

                                                학생이 요청을 <span className={styles.addStudentCommentHighlight}>수락</span>하면 강의에 추가됩니다.
                                            </div>
                                            <br />

                                            <div className={styles.addType}>
                                                학생 이메일
                                            </div>
                                            <input
                                                type="email"
                                                name="studentEmail"
                                                value={inputStudentEmail}
                                                onChange={onChange}
                                                maxLength={30}
                                                required
                                                className={styles.addEmailInput}
                                            />

                                            <button
                                                className={styles.findEmailButton}
                                                onClick={() => {
                                                    findStudentByEmail(inputStudentEmail);
                                                }}>
                                                이메일 찾기
                                            </button>

                                            <div className={styles.findingEmailMessage}>
                                                {findingEmailMessage}
                                            </div>

                                            {
                                                authenticateButton

                                                &&

                                                <button
                                                    className={styles.addStudentSendButton}
                                                    onClick={addStudent}>
                                                    학생 인증 요청
                                                </button>
                                            }

                                            <br /><br />
                                            <button
                                                className={styles.cancelButton}
                                                onClick={() => {
                                                    setIsAddingStudent(false);
                                                    setInputStudentEmail("");
                                                    setFindingEmailResults([]);
                                                    setFindingEmailMessage("");
                                                    setAuthenticateButton(false);
                                                }}>
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                }
                            </div>
                        }

                        {
                            tab === 2

                            &&

                            // 시험 관리 화면
                            <div>
                                {
                                    myTests.map((current) => (
                                        <Link to={"/class/" + classCode + "/test/" + current.id} style={{ textDecoration: "none" }}>
                                            <div className={styles.testElementsZone}>
                                                <div className={styles.testName}>
                                                    {current.testName}
                                                </div>
                                                
                                                <div className={styles.testDate}>
                                                    {new Date(current.testDate).toLocaleString()}
                                                </div>
                                            </div>
                                        </Link>                                  
                                    ))
                                }

                                <button
                                    className={styles.addButton}
                                    onClick={() => {
                                        setIsCreatingTest(true);
                                        setIsAddingStudent(false);
                                    }}>
                                    시험 추가하기
                                    <img alt="home" src={process.env.PUBLIC_URL + "/icon/add.png"} />
                                </button>



                                {/* 시험 추가 화면 */}
                                {
                                    isCreatingTest

                                    &&

                                    <div className={styles.addBackground}>
                                        <div className={styles.addContainer}>
                                            <form onSubmit={createTest}>
                                                <div className={styles.addType}>
                                                    이름
                                                </div>
                                                <input
                                                    type="text"
                                                    name="testName"
                                                    value={inputTestName}
                                                    onChange={onChange}
                                                    maxLength={30}
                                                    required
                                                    className={styles.addInput}
                                                />
                                                <br /><br />

                                                <div className={styles.addType}>
                                                    시작 시각
                                                </div>
                                                <input
                                                    type="datetime-local"
                                                    name="testDate"
                                                    value={inputTestDate}
                                                    onChange={onChange}
                                                    required
                                                    className={styles.addInput}
                                                />
                                                <br /><br />

                                                <div className={styles.addType}>
                                                    진행 시간
                                                </div>
                                                <input
                                                    type="number"
                                                    name="testTime"
                                                    value={inputTestTime}
                                                    onChange={onChange}
                                                    required
                                                    className={styles.addTimeInput}
                                                />분
                                                <br /><br />

                                                <div className={styles.addType}>
                                                    시험지 및 점수 공개
                                                </div>
                                                <input
                                                    type="button"
                                                    value="공개 안 함"
                                                    className={inputFeedback === false ? styles.buttonOn1 : styles.buttonOff1}
                                                    onClick={() => {
                                                        setInputFeedback(false);
                                                    }}
                                                />
                                                <input
                                                    type="button"
                                                    value="공개 함"
                                                    className={inputFeedback === true ? styles.buttonOn3 : styles.buttonOff3}
                                                    onClick={() => {
                                                        setInputFeedback(true);
                                                    }}
                                                />
                                                <br /><br /><br />

                                                <input
                                                    className={styles.acceptButton}
                                                    type="submit"
                                                    value="만들기"
                                                />

                                                <button
                                                    className={styles.cancelButton}
                                                    onClick={() => {
                                                        setIsCreatingTest(false);
                                                        setInputTestName("");
                                                    }}>
                                                    취소
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                }
                            </div>
                        }
                    </div>

                    :

                    // 학생 전용 화면
                    <div>
                        {
                            studentClassInfo.studentId === userObject.uid

                                ?

                                <div>
                                    {
                                        studentClassInfo.authenticate

                                            ?

                                            // 학생 인증이 된 경우
                                            <div>
                                                {
                                                    userData?.userType === "student" && myStudentsInfo.map(row => row.email).includes(userObject.email)

                                                        ?

                                                        <div>
                                                            {/* 메뉴 탭 */}
                                                            <div className={styles.tabButtonZone}>
                                                                <button
                                                                    className={tab === 1 ? styles.tabOn : styles.tabOff}
                                                                    onClick={() => { setTab(1) }}>
                                                                    시험
                                                                </button>
                                                            </div>


                                                            {
                                                                myTests.map((current) => (
                                                                    <div className={styles.testElementsZone}>
                                                                        <div className={styles.testName}>
                                                                            {current.testName}
                                                                        </div>

                                                                        <div>
                                                                        </div>

                                                                        <Link to={"/class/" + classCode + "/test/" + current.id} style={{ textDecoration: 'none' }}>
                                                                            <button className={styles.testSettingButton}>
                                                                                응시
                                                                            </button>
                                                                        </Link>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>

                                                        :

                                                        <div>
                                                            접근 오류
                                                        </div>
                                                }
                                            </div>

                                            :

                                            // 학생 인증이 되지 않은 경우
                                            <div>
                                                <div className={styles.message}>
                                                    강사가 당신을 강의에 추가했습니다. 해당 강의를 수강하시겠습니까?
                                                </div>
                                                <br />

                                                <button onClick={acceptAuthenticate} className={styles.acceptButton}>
                                                    수락
                                                </button>

                                                <Link to={"/"} style={{ textDecoration: 'none' }}>
                                                    <button className={styles.cancelButton}>
                                                        거절
                                                    </button>
                                                </Link>
                                            </div>
                                    }
                                </div>

                                :

                                <div>
                                    접근 오류
                                </div>
                        }
                    </div>
            }

            {/* <Link to={"/"} style={{ textDecoration: 'none' }}>
                <span>
                    홈으로 돌아가기
                </span>
            </Link> */}
        </div>
    )
}

export default Class;