import axiosInstance from './axios'

export const fetcher = async ({ queryKey }: { queryKey: string[] }) => {
  const [url] = queryKey
  const res = await axiosInstance.get(url)
  return res.data
}

