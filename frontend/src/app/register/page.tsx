import React from 'react'

import { Button } from "@/components/ui/button"

const page = () => {
    return (
        <div className="p-4 flex flex-col gap-8 row-start-2 items-center mx-8">
            <h1 className="text-2xl pt-6 font-semibold">Register to Ditto</h1>
            <div className="w-80 flex justify-center  rounded-md p-4 bg-gray-900 ">
                <form className="w-full p-4 flex flex-col justify-center content-middle">
                    <div className="mb-2 w-full">
                        <label className="block">Name</label>
                        <input className="w-full mt-1 px-2 py-1 bg-gray-900 outline-gray-600 border-b-2 border-b-gray-300"
                        />
                    </div>

                    <div className="mb-2 w-full">
                        <label className="block">Email</label>
                        <input type="email" className="w-full mt-1 px-2 py-1 bg-gray-900 outline-gray-600 border-b-2 border-b-gray-300"
                        />
                    </div>
                    <div className="mb-2 w-full">
                        <label className="block">Password</label>
                        <input type="password" className="w-full mt-1 px-2 py-1 bg-gray-900 outline-gray-600 border-b-2 border-b-gray-300"
                        />
                    </div>
                    <div className="w-full mb-8">
                        <label className="block">Confirm Password</label>
                        <input type="password" className="w-full mt-1 px-2 py-1 bg-gray-900 outline-gray-600 border-b-2 border-b-gray-300"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-sky-600 text-white font-bold">Register</Button>
                </form>
            </div>
        </div>
    )
}

export default page
