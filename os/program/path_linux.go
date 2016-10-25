package program

import "os"

func path() (name string, err error) {
	return os.Readlink("/proc/self/exe")
}
