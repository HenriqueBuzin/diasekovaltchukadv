pipeline {
    agent any

    stages {

        stage('Deploy') {
            steps {
                script {

                    def branch = env.GIT_BRANCH

                    if (branch == 'main') {
                        sh '''
                        cd /root/diasekovaltchuk
                        git reset --hard
                        git pull origin main
                        docker compose --profile prod up -d --build
                        '''
                    }

                    else if (branch == 'dev') {
                        sh '''
                        cd /root/diasekovaltchuk-dev
                        git reset --hard
                        git pull origin dev
                        docker compose --profile dev up -d --build
                        '''
                    }

                    else {
                        echo "Branch não suportada: ${branch}"
                    }
                }
            }
        }

    }
}
