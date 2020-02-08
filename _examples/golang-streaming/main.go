package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/pkg/errors"
)

func main() {
	err := startServer()
	if err != nil {
		log.Fatal(err)
	}
}

func startServer() error {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("."))
	})

	webrpcHandler := NewExampleServiceServer(&ExampleServiceRPC{})
	r.Handle("/*", webrpcHandler)

	return http.ListenAndServe(":4242", r)
}

type ExampleServiceRPC struct {
}

func (s *ExampleServiceRPC) Ping(ctx context.Context) error {
	return nil
}

func (s *ExampleServiceRPC) GetUser(ctx context.Context, userID uint64) (*User, error) {
	if userID == 911 {
		return nil, ErrorNotFound("fdf")
	}

	return &User{
		Id:       userID,
		Username: "hihi",
	}, nil
}

// func (s *ExampleServiceRPC) Upload(ctx context.Context, reader UploadReader) (bool, error) {
// 	return false, nil
// }

func (s *ExampleServiceRPC) Download(ctx context.Context, file string, writer DownloadResponseWriter) {

	// TODO: what do we do about error..?

	// I think writer.Error(err) looks better too btw.. or WriteError()
	// and WriteData ..

	// or.. just .Write() and take []byte() is another option..
	// or .Write(v interface{}) might work? we can test if its an error easily then..

	// I think best is .Write(), .WriteError() and .WriteEOF() -- lets consider if .WriteError() should EOF automatically?

	// TODO: write something every 3 seconds
	// up to N seconds, say, 100?

	i := 0
	for {
		err := writer.Write(fmt.Sprintf("send %d", i), nil)
		if err != nil {
			fmt.Println("ERR!!", err)
			return
		}
		time.Sleep(3 * time.Second)
		if i >= 100 {
			break
		}

		i += 1
	}

	// err := writer.Write("f1", nil)
	// if err != nil {
	// 	fmt.Println("ERR!!", err)
	// 	return
	// }
	// time.Sleep(1000 * time.Millisecond)

	// writer.Write("f2", nil)
	// time.Sleep(1000 * time.Millisecond)

	// writer.Write("f3", nil)
	// time.Sleep(1000 * time.Millisecond)

	writer.WriteEOF() // we done ..

}

// NOTE: the code belong here would be code-generated..
// also possible we have just a sinle streamResponseWriter

type streamDownloadWriter struct {
	w             http.ResponseWriter
	doneCh        chan struct{}
	headerWritten bool
}

var _ DownloadResponseWriter = &streamDownloadWriter{}

// func (s *streamDownloadWriter) Error(err error) error {
// 	return nil
// }

func (s *streamDownloadWriter) Write(base64 string, err error) error {
	flusher, ok := s.w.(http.Flusher)
	if !ok {
		return errors.Errorf("expected http.ResponseWriter to be an http.Flusher")
	}

	w := s.w
	ret0 := base64

	if !s.headerWritten {
		w.Header().Set("Content-Type", "application/json")
		s.headerWritten = true // TODO: this doesnt mean written, this is set..
		// perhaps we track number of flushes, etc. "n" then chcek if n == 0..?
	}

	if err != nil {
		RespondWithError(w, err)
		return nil //..
	}

	respContent := struct {
		Ret0 string `json:"base64"`
	}{ret0}

	respBody, err := json.Marshal(respContent)
	if err != nil {
		err = WrapError(ErrInternal, err, "failed to marshal json response")
		RespondWithError(w, err)
		return nil //..
	}

	// TODO: lets write initial 1024 stuff -- prob need a flag like seedWritten

	s.w.Write([]byte(fmt.Sprintf("%x\r\n", len(respBody))))
	s.w.Write(respBody)
	s.w.Write([]byte("\r\n"))

	fmt.Printf("SEND: %s\n", respBody)

	flusher.Flush() // Trigger "chunked" encoding and send a chunk...

	return nil
}

func (s *streamDownloadWriter) WriteEOF() error {
	flusher, ok := s.w.(http.Flusher)
	if !ok {
		return errors.Errorf("expected http.ResponseWriter to be an http.Flusher")
	}

	// s.doneCh <- struct{}{}

	fmt.Fprintf(s.w, "0\r\n\r\n")
	flusher.Flush() // Trigger "chunked" encoding and send a chunk...

	return nil
}